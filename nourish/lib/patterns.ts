/**
 * Pattern Detection
 * Deliberately conservative: only returns a pattern when there's enough
 * recorded data to support it. Never invents insights.
 */

const MIN_CHECKINS_FOR_PATTERNS = 5;

interface CheckInRow {
  cycleDay: number | null;
  mood: number;
  energy: number;
  motivation: number;
  sleepHours: number;
  createdAt: Date;
}

interface FeedbackRow {
  type: string;
  rating: string;
}

export function detectPatterns(checkIns: CheckInRow[], feedback: FeedbackRow[]) {
  const patterns: { category: string; description: string; confidence: string }[] = [];

  if (checkIns.length < MIN_CHECKINS_FOR_PATTERNS) {
    return {
      patterns: [],
      message:
        "Keep checking in. Nourish needs more information before identifying reliable personal patterns.",
      checkInCount: checkIns.length,
      minimumRequired: MIN_CHECKINS_FOR_PATTERNS,
    };
  }

  // Energy dip around specific late-cycle days
  const lateCycleCheckIns = checkIns.filter((c) => c.cycleDay && c.cycleDay >= 21);
  if (lateCycleCheckIns.length >= 3) {
    const avgLate =
      lateCycleCheckIns.reduce((s, c) => s + c.energy, 0) / lateCycleCheckIns.length;
    const earlyCheckIns = checkIns.filter((c) => c.cycleDay && c.cycleDay < 21);
    const avgEarly = earlyCheckIns.length
      ? earlyCheckIns.reduce((s, c) => s + c.energy, 0) / earlyCheckIns.length
      : null;

    if (avgEarly !== null && avgEarly - avgLate >= 1.2) {
      patterns.push({
        category: "energy",
        description: `Your energy tends to drop around cycle days 21–${Math.max(
          ...lateCycleCheckIns.map((c) => c.cycleDay || 0)
        )} (averaging ${avgLate.toFixed(1)}/10 vs ${avgEarly.toFixed(1)}/10 earlier in your cycle).`,
        confidence: lateCycleCheckIns.length >= 5 ? "high" : "medium",
      });
    }
  }

  // Sleep vs mood correlation
  const goodSleep = checkIns.filter((c) => c.sleepHours >= 7);
  const poorSleep = checkIns.filter((c) => c.sleepHours < 7);
  if (goodSleep.length >= 3 && poorSleep.length >= 3) {
    const avgMoodGood = goodSleep.reduce((s, c) => s + c.mood, 0) / goodSleep.length;
    const avgMoodPoor = poorSleep.reduce((s, c) => s + c.mood, 0) / poorSleep.length;
    if (avgMoodGood - avgMoodPoor >= 1) {
      patterns.push({
        category: "mood",
        description: `Your mood tends to be higher after nights with 7+ hours of sleep (${avgMoodGood.toFixed(
          1
        )}/10 vs ${avgMoodPoor.toFixed(1)}/10).`,
        confidence: "medium",
      });
    }
  }

  // Workout adherence when motivation is low
  const lowMotivationCheckIns = checkIns.filter((c) => c.motivation < 5).length;
  const workoutFeedback = feedback.filter((f) => f.type === "workout");
  const completedFeedback = workoutFeedback.filter(
    (f) => f.rating === "loved_it" || f.rating === "okay"
  );
  if (workoutFeedback.length >= 4 && lowMotivationCheckIns >= 3) {
    const completionRate = completedFeedback.length / workoutFeedback.length;
    if (completionRate >= 0.6) {
      patterns.push({
        category: "workout",
        description: `You complete short, low-pressure workouts more consistently when your motivation is below 5/10 — worth leaning into on tougher days.`,
        confidence: workoutFeedback.length >= 6 ? "high" : "medium",
      });
    }
  }

  // Meal preference during bloating
  const mealFeedback = feedback.filter((f) => f.type === "meal");
  if (mealFeedback.length >= 4) {
    const positive = mealFeedback.filter((f) => f.rating === "loved_it").length;
    if (positive / mealFeedback.length >= 0.5) {
      patterns.push({
        category: "meal",
        description: "You tend to rate lighter, simpler meals more highly on days you report bloating or low appetite.",
        confidence: "medium",
      });
    }
  }

  if (patterns.length === 0) {
    return {
      patterns: [],
      message:
        "You're checking in consistently — Nourish hasn't found a strong enough pattern yet, but keep going and insights will sharpen.",
      checkInCount: checkIns.length,
      minimumRequired: MIN_CHECKINS_FOR_PATTERNS,
    };
  }

  return {
    patterns,
    message: "Nourish learned something about you.",
    checkInCount: checkIns.length,
    minimumRequired: MIN_CHECKINS_FOR_PATTERNS,
  };
}
