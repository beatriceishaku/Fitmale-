"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipSelect, ProgressDots, ErrorBanner } from "@/components/ui";
import { setUserId } from "@/lib/session";

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];
const GOALS = ["Strength", "General fitness", "Flexibility", "Weight management", "Stress management", "Better energy", "General wellness"];
const ACTIVITY_LEVELS = ["Mostly sedentary", "Lightly active", "Moderately active", "Very active"];
const WORKOUT_STYLES = ["Gym", "Home", "Walking", "Running", "Strength training", "Yoga", "Pilates", "Dance", "Low-impact"];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: personal
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  // Step 2: workout prefs
  const [workoutPrefs, setWorkoutPrefs] = useState<string[]>([]);

  // Step 3: cycle
  const [knowsCycle, setKnowsCycle] = useState<"yes" | "unsure">("yes");
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);

  // Step 4: food
  const [foodStyle, setFoodStyle] = useState("mixed");
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [restrictions, setRestrictions] = useState("");

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function canProceed(): boolean {
    if (step === 0) return !!(name && ageRange && fitnessGoal && activityLevel);
    if (step === 2) return !!lastPeriodStart;
    return true;
  }

  async function finishOnboarding() {
    setLoading(true);
    setError("");
    try {
      const userRes = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ageRange, fitnessGoal, activityLevel, workoutPrefs }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || "Could not create profile.");
      const userId = userData.user.id;
      setUserId(userId);

      const cycleRes = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lastPeriodStart,
          averageCycleLength: knowsCycle === "yes" ? averageCycleLength : 28,
          periodDuration,
          knowsCycleLength: knowsCycle === "yes",
        }),
      });
      if (!cycleRes.ok) throw new Error("Could not save cycle information.");

      await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          inventory: {},
          preferences: { style: foodStyle, allergies, dislikes, restrictions },
        }),
      });

      router.push("/kitchen");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step === TOTAL_STEPS - 1) {
      finishOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-14">
      <ProgressDots step={step} total={TOTAL_STEPS} />
      <div className="card">
        {step === 0 && (
          <div>
            <h2 className="font-display text-2xl text-plum-800 mb-6">Let's get to know you</h2>
            <label className="label">What should we call you?</label>
            <input className="input-field mb-5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <label className="label">Age range</label>
            <div className="mb-5"><ChipSelect options={AGE_RANGES} selected={ageRange ? [ageRange] : []} onToggle={(v) => setAgeRange(v)} /></div>
            <label className="label">Main fitness goal</label>
            <div className="mb-5"><ChipSelect options={GOALS} selected={fitnessGoal ? [fitnessGoal] : []} onToggle={(v) => setFitnessGoal(v)} /></div>
            <label className="label">Activity level</label>
            <ChipSelect options={ACTIVITY_LEVELS} selected={activityLevel ? [activityLevel] : []} onToggle={(v) => setActivityLevel(v)} />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl text-plum-800 mb-2">How do you like to move?</h2>
            <p className="text-sm text-plum-700/60 mb-6">Pick as many as you like — this just helps Nourish suggest things you'll actually enjoy.</p>
            <ChipSelect options={WORKOUT_STYLES} selected={workoutPrefs} onToggle={(v) => toggle(workoutPrefs, setWorkoutPrefs, v)} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl text-plum-800 mb-6">Tell us about your cycle</h2>
            <div className="mb-5">
              <ChipSelect
                options={["I know my cycle length", "I'm not sure"]}
                selected={[knowsCycle === "yes" ? "I know my cycle length" : "I'm not sure"]}
                onToggle={(v) => setKnowsCycle(v === "I know my cycle length" ? "yes" : "unsure")}
              />
            </div>
            <label className="label">Date your last period started</label>
            <input type="date" className="input-field mb-5" value={lastPeriodStart} onChange={(e) => setLastPeriodStart(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            {knowsCycle === "yes" && (
              <>
                <label className="label">Average cycle length: {averageCycleLength} days</label>
                <input type="range" min={21} max={40} value={averageCycleLength} onChange={(e) => setAverageCycleLength(Number(e.target.value))} className="w-full accent-lilac-400 mb-5" />
              </>
            )}
            <label className="label">Typical period duration: {periodDuration} days</label>
            <input type="range" min={2} max={10} value={periodDuration} onChange={(e) => setPeriodDuration(Number(e.target.value))} className="w-full accent-lilac-400" />
            <p className="text-xs text-plum-700/40 mt-4">Not sure is completely fine — Nourish will use a typical estimate and refine it as you check in.</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl text-plum-800 mb-6">Food preferences</h2>
            <label className="label">Style</label>
            <div className="mb-5">
              <ChipSelect
                options={["Nigerian/African", "International", "Vegetarian", "Vegan", "Mixed"]}
                selected={[foodStyle]}
                onToggle={(v) => setFoodStyle(v)}
              />
            </div>
            <label className="label">Allergies (optional)</label>
            <input className="input-field mb-5" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. peanuts, shellfish" />
            <label className="label">Foods you dislike (optional)</label>
            <input className="input-field mb-5" value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="e.g. okra, liver" />
            <label className="label">Other dietary restrictions (optional)</label>
            <input className="input-field" value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="e.g. low sodium" />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl text-plum-800 mb-3">You're all set, {name || "there"}.</h2>
            <p className="text-plum-700/60 mb-6 text-sm">
              Next we'll take a quick look at what's in your kitchen so Nourish can build meals
              around what you actually have.
            </p>
            <div className="bg-lilac-50 rounded-xl p-4 text-sm text-plum-700/70">
              Goal: <strong>{fitnessGoal || "—"}</strong> · Activity: <strong>{activityLevel || "—"}</strong> · Food style: <strong>{foodStyle}</strong>
            </div>
          </div>
        )}

        {error && <div className="mt-5"><ErrorBanner message={error} /></div>}

        <div className="flex justify-between mt-8">
          <button
            className="btn-secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
          >
            Back
          </button>
          <button className="btn-primary" onClick={next} disabled={!canProceed() || loading}>
            {loading ? "Saving..." : step === TOTAL_STEPS - 1 ? "Go to my kitchen" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
