import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCycleDay, getCyclePhaseLabel } from "@/lib/cycle";
import { generateDailyPlan } from "@/lib/ai-service";
import type { NourishContext } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { userId, checkInId, rejectedMealName } = await req.json();
    if (!userId || !checkInId) {
      return NextResponse.json({ error: "userId and checkInId are required." }, { status: 400 });
    }

    const [user, cycle, checkIn, inventory, foodPref] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.cycle.findUnique({ where: { userId } }),
      prisma.dailyCheckIn.findUnique({ where: { id: checkInId }, include: { symptoms: true } }),
      prisma.foodInventoryItem.findMany({ where: { userId } }),
      prisma.foodPreference.findUnique({ where: { userId } }),
    ]);

    if (!user || !checkIn) {
      return NextResponse.json({ error: "User or check-in not found." }, { status: 404 });
    }

    const byCategory = (cat: string) => inventory.filter((i) => i.category === cat).map((i) => i.name);

    const context: NourishContext = {
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
      previousPatterns: [],
      recentFeedback: [],
    };

    const { plan, usedFallback } = await generateDailyPlan(context, rejectedMealName);

    const mealRec = await prisma.mealRecommendation.create({
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
    });

    return NextResponse.json({ meal: plan.meal, mealId: mealRec.id, usedFallback });
  } catch (err) {
    console.error("POST /api/recommendations/meal error:", err);
    return NextResponse.json({ error: "Could not generate another meal." }, { status: 500 });
  }
}
