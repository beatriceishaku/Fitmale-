export interface NourishContext {
  cycleDay: number;
  cycleLength: number;
  cyclePhase: string;
  mood: number;
  energy: number;
  motivation: number;
  stress: number;
  sleepHours: number;
  symptoms: string[];
  journal?: string;
  workoutTimeMins: number;
  fitnessGoal: string;
  workoutPrefs: string[];
  availableFoods: {
    carbohydrates: string[];
    proteins: string[];
    vegetables: string[];
    fruits: string[];
    healthyFats: string[];
  };
  foodStyle: string;
  allergies?: string;
  dislikes?: string;
  budgetTier?: string;
  cookingTimeMins?: number;
  previousPatterns: string[];
  recentFeedback: string[];
}

export interface NourishPlan {
  daily_summary: string;
  workout: {
    title: string;
    duration_minutes: number;
    intensity: "low" | "moderate" | "high";
    reason: string;
    exercises: string[];
  };
  meal: {
    name: string;
    ingredients: string[];
    instructions: string[];
    estimated_time_minutes: number;
    estimated_budget: string;
    reason: string;
  };
  recovery: {
    activity: string;
    duration_minutes: number;
    reason: string;
  };
  personal_insight: string;
  safety_note: string;
}

export const FOOD_CATEGORIES = [
  "carbohydrates",
  "proteins",
  "vegetables",
  "fruits",
  "healthyFats",
] as const;

export const SYMPTOM_OPTIONS = [
  "Cramps",
  "Bloating",
  "Headache",
  "Fatigue",
  "Tenderness",
  "Low appetite",
  "Increased appetite",
  "Mood changes",
  "None",
  "Something feels different",
];
