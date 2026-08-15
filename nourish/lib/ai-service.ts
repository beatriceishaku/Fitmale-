import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NourishContext, NourishPlan } from "@/types";

const RESPONSE_SCHEMA_INSTRUCTIONS = `
Return ONLY valid JSON (no markdown fences, no preamble, no commentary) matching exactly this shape:

{
  "daily_summary": string,
  "workout": {
    "title": string,
    "duration_minutes": number,
    "intensity": "low" | "moderate" | "high",
    "reason": string,
    "exercises": string[]
  },
  "meal": {
    "name": string,
    "ingredients": string[],
    "instructions": string[],
    "estimated_time_minutes": number,
    "estimated_budget": string,
    "reason": string
  },
  "recovery": {
    "activity": string,
    "duration_minutes": number,
    "reason": string
  },
  "personal_insight": string,
  "safety_note": string
}
`;

function buildPrompt(context: NourishContext, avoidMeal?: string): string {
  const foods = context.availableFoods;

  return `You are Nourish, an AI wellness companion for women. You are NOT a doctor and must never diagnose conditions or make definitive medical claims. You personalize a single day's wellness plan (a workout, a meal, and a recovery activity) using the structured context below. You must adapt to how this specific person is feeling today, not just apply a generic menstrual-cycle template. When available food ingredients exist, prioritize meals built primarily from those ingredients and respect the budget.

USER CONTEXT:
Cycle day: ${context.cycleDay} of an average ${context.cycleLength}-day cycle (rough phase: ${context.cyclePhase})
Fitness goal: ${context.fitnessGoal}
Preferred workout styles: ${context.workoutPrefs.join(", ") || "no strong preference"}

Today's check-in:
- Mood: ${context.mood}/10
- Energy: ${context.energy}/10
- Motivation: ${context.motivation}/10
- Stress: ${context.stress}/10
- Sleep: ${context.sleepHours} hours
- Symptoms: ${context.symptoms.join(", ") || "none reported"}
- Journal note: ${context.journal || "none"}
- Available workout time: ${context.workoutTimeMins} minutes

Available ingredients:
- Carbohydrates: ${foods.carbohydrates.join(", ") || "none listed"}
- Protein: ${foods.proteins.join(", ") || "none listed"}
- Vegetables: ${foods.vegetables.join(", ") || "none listed"}
- Fruits: ${foods.fruits.join(", ") || "none listed"}
- Healthy fats: ${foods.healthyFats.join(", ") || "none listed"}

Food style: ${context.foodStyle}
Allergies: ${context.allergies || "none reported"}
Dislikes: ${context.dislikes || "none reported"}
Budget: ${context.budgetTier || "not specified"}
Cooking time available: ${context.cookingTimeMins ?? "not specified"} minutes

Previously detected personal patterns (only use if present, never invent new ones):
${context.previousPatterns.length ? context.previousPatterns.map((p) => `- ${p}`).join("\n") : "- none yet"}

Recent feedback on past recommendations:
${context.recentFeedback.length ? context.recentFeedback.map((f) => `- ${f}`).join("\n") : "- none yet"}

${avoidMeal ? `The user rejected this previous meal suggestion, do not repeat it: "${avoidMeal}". Suggest something different using the same available ingredients.` : ""}

Rules:
- If energy, motivation, or sleep are low, or stress is high, recommend shorter/gentler activity (walking, mobility, stretching, breathing) instead of high-intensity training. Offer a "5-minute starter" framing if motivation is very low.
- If energy and motivation are both high, you may recommend strength training or a more challenging session, sized to the available time.
- Never say a food is required "because of phase Y" — use wellness language, not medical claims.
- Prioritize ingredients the user already has; do not suggest ingredients that require significant unlisted purchases beyond the stated budget.
- personal_insight should be a short, warm, specific sentence connecting today's plan to the user's stated context or previous patterns (if any exist) — do not fabricate a pattern that wasn't provided.
- safety_note should usually be a short reassuring empty-ish note (e.g. "Nothing concerning today — listen to your body."). Only include stronger guidance if the journal or symptoms suggest something the user should monitor, and in that case gently suggest checking in with a healthcare professional if it persists or worsens. Never diagnose.

${RESPONSE_SCHEMA_INSTRUCTIONS}`;
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw;
}

function validatePlan(data: any): data is NourishPlan {
  if (!data || typeof data !== "object") return false;
  if (typeof data.daily_summary !== "string") return false;
  if (!data.workout || typeof data.workout.title !== "string") return false;
  if (!Array.isArray(data.workout.exercises)) return false;
  if (!data.meal || typeof data.meal.name !== "string") return false;
  if (!Array.isArray(data.meal.ingredients) || !Array.isArray(data.meal.instructions)) return false;
  if (!data.recovery || typeof data.recovery.activity !== "string") return false;
  if (typeof data.personal_insight !== "string") return false;
  if (typeof data.safety_note !== "string") return false;
  return true;
}

function fallbackPlan(context: NourishContext): NourishPlan {
  const gentle = context.energy <= 4 || context.motivation <= 4 || context.stress >= 7;
  return {
    daily_summary: gentle
      ? "A lower-key day — we're keeping things gentle based on how you're feeling."
      : "A solid day to move a little more and eat well with what you've got on hand.",
    workout: gentle
      ? {
          title: "Gentle Walk + Stretch",
          duration_minutes: Math.min(context.workoutTimeMins, 20),
          intensity: "low",
          reason: "Your energy or motivation is lower today, so a light walk and stretch keeps you moving without adding pressure.",
          exercises: ["5 min easy walk", "Gentle full-body stretch", "Box breathing, 2 minutes"],
        }
      : {
          title: "Full-Body Starter Circuit",
          duration_minutes: Math.min(context.workoutTimeMins, 30),
          intensity: "moderate",
          reason: "Your energy looks good today, so a fuller circuit fits within your available time.",
          exercises: ["Bodyweight squats x12", "Incline push-ups x10", "Glute bridges x15", "Plank, 30 sec"],
        },
    meal: {
      name: context.availableFoods.carbohydrates[0] || context.availableFoods.proteins[0]
        ? `Simple ${context.availableFoods.proteins[0] || "protein"} & ${context.availableFoods.carbohydrates[0] || "carb"} bowl`
        : "Balanced bowl with what you have on hand",
      ingredients: [
        ...(context.availableFoods.proteins.slice(0, 1)),
        ...(context.availableFoods.carbohydrates.slice(0, 1)),
        ...(context.availableFoods.vegetables.slice(0, 2)),
      ].filter(Boolean),
      instructions: [
        "Cook the protein and carb component together or side by side.",
        "Add the vegetables, lightly seasoned.",
        "Combine in a bowl and serve warm.",
      ],
      estimated_time_minutes: context.cookingTimeMins || 20,
      estimated_budget: context.budgetTier || "flexible",
      reason: "Built from ingredients you already have, keeping things simple and realistic for today.",
    },
    recovery: {
      activity: context.stress >= 6 ? "Slow breathing + journaling" : "Short screen break and stretch",
      duration_minutes: 10,
      reason: "A short reset to match your stress and mood today.",
    },
    personal_insight: "This plan is generated from a fallback template right now — once the AI service reconnects, insights will get sharper as Nourish learns more about you.",
    safety_note: "Nothing urgent flagged today. If anything feels off or persists, it's always okay to check in with a healthcare professional.",
  };
}

export async function generateDailyPlan(
  context: NourishContext,
  avoidMeal?: string
): Promise<{ plan: NourishPlan; usedFallback: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { plan: fallbackPlan(context), usedFallback: true };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = buildPrompt(context, avoidMeal);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr);

    if (!validatePlan(parsed)) {
      throw new Error("AI response failed schema validation");
    }

    return { plan: parsed, usedFallback: false };
  } catch (err) {
    console.error("Nourish AI service error, using fallback:", err);
    return { plan: fallbackPlan(context), usedFallback: true };
  }
}

/** Non-diagnostic response for the "something feels different" flow. */
export async function generateWellnessGuidance(
  category: string,
  description: string
): Promise<{ guidance: string; suggestProfessional: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const urgentKeywords = ["severe", "unbearable", "fainting", "heavy bleeding", "can't", "worst", "emergency"];
  const looksUrgent = urgentKeywords.some((k) => description.toLowerCase().includes(k));

  if (!apiKey) {
    return {
      guidance: looksUrgent
        ? "What you're describing sounds significant. Nourish can't diagnose what's happening, so please consider reaching out to a healthcare professional soon, especially since this feels different from your usual pattern."
        : "Thanks for flagging this — Nourish can't diagnose what's going on, but it's worth keeping an eye on. Rest, hydrate, and be gentle with yourself today. If it continues or worsens, please check in with a healthcare professional.",
      suggestProfessional: looksUrgent,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `A user of a women's wellness app reported "${category}" with this description: "${description}". You are not a doctor and must not diagnose. Respond with 2-3 warm, supportive sentences of general wellness guidance (rest, hydration, gentle movement, tracking symptoms), and if the description suggests something that could be urgent or unusual, clearly and calmly recommend she consult a qualified healthcare professional promptly. Do not make definitive medical claims. Keep it concise, plain text, no markdown.`;
    const result = await model.generateContent(prompt);
    return { guidance: result.response.text().trim(), suggestProfessional: looksUrgent };
  } catch (err) {
    console.error("Wellness guidance AI error:", err);
    return {
      guidance: "Thanks for sharing that. Nourish can't diagnose symptoms, so please consider checking in with a healthcare professional if this feels unusual or persists.",
      suggestProfessional: looksUrgent,
    };
  }
}
