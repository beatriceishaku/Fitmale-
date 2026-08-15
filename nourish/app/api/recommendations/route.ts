import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCycleDay, getCyclePhaseLabel } from "@/lib/cycle";
import { generateDailyPlan } from "@/lib/ai-service";
import type { NourishContext } from "@/types";

async function buildContext(userId: string, checkInId: string): Promise<NourishContext | null> {
  const [user, cycle, checkIn, inventory, foodPref, patterns, feedback] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.cycle.findUnique({ where: { userId } }),
    prisma.dailyCheckIn.findUnique({ where: { id: checkInId }, include: { symptoms: true } }),
    prisma.foodInventoryItem.findMany({ where: { userId } }),
    prisma.foodPreference.findUnique({ where: { userId } }),
    prisma.wellnessPattern.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.feedback.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  if (!user || !checkIn) return null;

  const byCategory = (cat: string) =>
    inventory.filter((i) => i.category === cat).map((i) => i.name);

  return {
    cycleDay: cycle ? getCycleDay(cycle) : checkIn.cycleDay || 1,
    cycleLength: cycle?.averageCycleLength || 28,
    cyclePhase: cycle ? getCyclePhaseLabel(cycle) : "unknown",
    mood: checkIn.mood,
    energy: checkIn.energy,
    motivation: checkIn.motivation,
    stress: checkIn.stress,
    sleepHours: checkIn.sleepHours,
    symptoms: checkIn.symptoms.map((s) => s.name),
    journal: checkIn.journal || undefined,
    workoutTimeMins: checkIn.workoutTimeMins,
    fitnessGoal: user.fitnessGoal,
    workoutPrefs: user.workoutPrefs ? JSON.parse(user.workoutPrefs) : [],
    availableFoods: {
      carbohydrates: byCategory("carbohydrate"),
      proteins: byCategory("protein"),
      vegetables: byCategory("vegetable"),
      fruits: byCategory("fruit"),
      healthyFats: byCategory("healthyFat"),
    },
    foodStyle: foodPref?.style || "mixed",
    allergies: foodPref?.allergies || undefined,
    dislikes: foodPref?.dislikes || undefined,
    budgetTier: foodPref?.budgetTier || undefined,
    cookingTimeMins: foodPref?.cookingTimeMins || undefined,
    previousPatterns: patterns.map((p) => p.description),
    recentFeedback: feedback.map((f) => `${f.type}: ${f.rating}${f.note ? ` (${f.note})` : ""}`),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, checkInId, avoidMeal } = body;

    if (!userId || !checkInId) {
      return NextResponse.json({ error: "userId and checkInId are required." }, { status: 400 });
    }

    const context = await buildContext(userId, checkInId);
    if (!context) {
      return NextResponse.json({ error: "Could not build context — check-in or user not found." }, { status: 404 });
    }

    const { plan, usedFallback } = await generateDailyPlan(context, avoidMeal);

    const [workoutRec, mealRec, recoveryRec] = await Promise.all([
      prisma.workoutRecommendation.create({
        data: {
          userId,
          checkInId,
          title: plan.workout.title,
          durationMinutes: plan.workout.duration_minutes,
          intensity: plan.workout.intensity,
          reason: plan.workout.reason,
          exercises: JSON.stringify(plan.workout.exercises),
        },
      }),
      prisma.mealRecommendation.create({
        data: {
          userId,
          checkInId,
          name: plan.meal.name,
          ingredients: JSON.stringify(plan.meal.ingredients),
          instructions: JSON.stringify(plan.meal.instructions),
          estimatedTimeMinutes: plan.meal.estimated_time_minutes,
          estimatedBudget: plan.meal.estimated_budget,
          reason: plan.meal.reason,
        },
      }),
      prisma.recoveryRecommendation.create({
        data: {
          userId,
          checkInId,
          activity: plan.recovery.activity,
          durationMinutes: plan.recovery.duration_minutes,
          reason: plan.recovery.reason,
        },
      }),
    ]);

    return NextResponse.json({
      plan,
      usedFallback,
      ids: { workoutId: workoutRec.id, mealId: mealRec.id, recoveryId: recoveryRec.id },
    });
  } catch (err) {
    console.error("POST /api/recommendations error:", err);
    return NextResponse.json({ error: "Could not generate today's plan. Please try again." }, { status: 500 });
  }
}
