"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner, ErrorBanner } from "@/components/ui";
import { getUserId } from "@/lib/session";
import type { NourishPlan } from "@/types";

const WORKOUT_FEEDBACK = [
  { label: "Loved it", value: "loved_it" },
  { label: "It was okay", value: "okay" },
  { label: "Too difficult", value: "too_difficult" },
  { label: "Too easy", value: "too_easy" },
  { label: "Didn't want to exercise", value: "didnt_want_to" },
];

const MEAL_FEEDBACK = [
  { label: "Loved it", value: "loved_it" },
  { label: "Too heavy", value: "too_heavy" },
  { label: "Too complicated", value: "too_complicated" },
  { label: "Didn't like it", value: "didnt_like_it" },
];

const RECOVERY_FEEDBACK = [
  { label: "Helpful", value: "helpful" },
  { label: "Not helpful", value: "not_helpful" },
];

function PlanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const checkInId = params.get("checkInId");

  const [userId, setUid] = useState<string | null>(null);
  const [plan, setPlan] = useState<NourishPlan | null>(null);
  const [ids, setIds] = useState<{ workoutId?: string; mealId?: string; recoveryId?: string }>({});
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mealLoading, setMealLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = getUserId();
    if (!id || !checkInId) {
      router.push("/onboarding");
      return;
    }
    setUid(id);
    generatePlan(id, checkInId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInId]);

  async function generatePlan(uid: string, cid: string, avoidMeal?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, checkInId: cid, avoidMeal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate today's plan.");
      setPlan(data.plan);
      setIds(data.ids);
      setUsedFallback(data.usedFallback);
    } catch (err: any) {
      setError(err.message || "Something went wrong generating your plan.");
    } finally {
      setLoading(false);
    }
  }

  async function tryAnotherMeal() {
    if (!userId || !checkInId || !plan) return;
    setMealLoading(true);
    try {
      const res = await fetch("/api/recommendations/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, checkInId, rejectedMealName: plan.meal.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan({ ...plan, meal: data.meal });
      setIds((prev) => ({ ...prev, mealId: data.mealId }));
    } catch {
      setError("Couldn't fetch another meal right now — please try again.");
    } finally {
      setMealLoading(false);
    }
  }

  async function sendFeedback(type: "workout" | "meal" | "recovery", rating: string) {
    if (!userId) return;
    setFeedbackGiven((prev) => ({ ...prev, [type]: rating }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          rating,
          workoutId: type === "workout" ? ids.workoutId : undefined,
          mealId: type === "meal" ? ids.mealId : undefined,
          recoveryId: type === "recovery" ? ids.recoveryId : undefined,
        }),
      });
    } catch {
      // Non-blocking — feedback failing silently is acceptable for MVP UX.
    }
  }

  if (loading) return <Spinner label="Building today's plan for you..." />;
  if (error) return <main className="max-w-xl mx-auto px-6 py-14"><ErrorBanner message={error} /></main>;
  if (!plan) return null;

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl text-plum-800 mb-2">Today's Nourish Plan</h1>
      <p className="text-plum-700/70 mb-1">{plan.daily_summary}</p>
      {usedFallback && (
        <p className="text-xs text-plum-700/40 mb-6">
          (Generated from Nourish's built-in fallback logic — connect a Gemini API key for fully AI-personalized plans.)
        </p>
      )}

      {/* MOVE */}
      <section className="card mb-6 border-l-4 border-lilac-400">
        <span className="text-xs font-semibold tracking-wide uppercase text-lilac-500">Move</span>
        <h2 className="font-display text-xl text-plum-800 mt-1 mb-2">{plan.workout.title}</h2>
        <p className="text-sm text-plum-700/50 mb-3">{plan.workout.duration_minutes} min · {plan.workout.intensity} intensity</p>
        <p className="text-sm text-plum-700/70 mb-3">{plan.workout.reason}</p>
        <ul className="list-disc list-inside text-sm text-plum-700/80 mb-4 space-y-1">
          {plan.workout.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
        </ul>
        <FeedbackRow options={WORKOUT_FEEDBACK} selected={feedbackGiven.workout} onSelect={(v) => sendFeedback("workout", v)} />
      </section>

      {/* EAT */}
      <section className="card mb-6 border-l-4 border-sage-500">
        <span className="text-xs font-semibold tracking-wide uppercase text-sage-600">Eat</span>
        <h2 className="font-display text-xl text-plum-800 mt-1 mb-2">{plan.meal.name}</h2>
        <p className="text-sm text-plum-700/50 mb-3">{plan.meal.estimated_time_minutes} min · {plan.meal.estimated_budget}</p>
        <p className="text-sm text-plum-700/70 mb-3">{plan.meal.reason}</p>
        <p className="text-sm font-medium text-plum-700/80 mb-1">Ingredients</p>
        <ul className="list-disc list-inside text-sm text-plum-700/80 mb-3 space-y-1">
          {plan.meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
        <p className="text-sm font-medium text-plum-700/80 mb-1">Instructions</p>
        <ol className="list-decimal list-inside text-sm text-plum-700/80 mb-4 space-y-1">
          {plan.meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
        <button className="btn-secondary text-sm py-2 px-4 mb-4" onClick={tryAnotherMeal} disabled={mealLoading}>
          {mealLoading ? "Finding another..." : "Try another meal"}
        </button>
        <FeedbackRow options={MEAL_FEEDBACK} selected={feedbackGiven.meal} onSelect={(v) => sendFeedback("meal", v)} />
      </section>

      {/* RESET */}
      <section className="card mb-6 border-l-4 border-blush-300">
        <span className="text-xs font-semibold tracking-wide uppercase text-blush-400">Reset</span>
        <h2 className="font-display text-xl text-plum-800 mt-1 mb-2">{plan.recovery.activity}</h2>
        <p className="text-sm text-plum-700/50 mb-3">{plan.recovery.duration_minutes} min</p>
        <p className="text-sm text-plum-700/70 mb-4">{plan.recovery.reason}</p>
        <FeedbackRow options={RECOVERY_FEEDBACK} selected={feedbackGiven.recovery} onSelect={(v) => sendFeedback("recovery", v)} />
      </section>

      {plan.personal_insight && (
        <section className="card mb-6 bg-lilac-50">
          <p className="text-sm text-plum-700/80"><strong>Personal insight:</strong> {plan.personal_insight}</p>
        </section>
      )}

      {plan.safety_note && (
        <section className="card mb-6 bg-blush-50">
          <p className="text-sm text-plum-700/80">{plan.safety_note}</p>
        </section>
      )}

      <Link href="/dashboard" className="btn-primary block text-center">
        Go to my dashboard
      </Link>
    </main>
  );
}

function FeedbackRow({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selected?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-plum-700/10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`chip text-xs ${selected === opt.value ? "chip-active" : "chip-inactive"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PlanContent />
    </Suspense>
  );
}
