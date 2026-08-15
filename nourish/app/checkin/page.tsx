"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Slider, ChipSelect, ErrorBanner, Spinner } from "@/components/ui";
import { SYMPTOM_OPTIONS } from "@/types";
import { getUserId, setTodayCheckInId } from "@/lib/session";

const TIME_OPTIONS = [10, 20, 30, 45, 60];
const FEELS_DIFFERENT_CATEGORIES = [
  "Unusual pain",
  "Unusual bleeding",
  "New symptom",
  "Significant mood change",
  "Very low energy",
  "Something else",
];

export default function CheckInPage() {
  const router = useRouter();
  const [userId, setUid] = useState<string | null>(null);

  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [workoutTime, setWorkoutTime] = useState<number>(20);

  const [showFeelsDifferent, setShowFeelsDifferent] = useState(false);
  const [fdCategory, setFdCategory] = useState("");
  const [fdDescription, setFdDescription] = useState("");
  const [guidance, setGuidance] = useState<{ guidance: string; suggestProfessional: boolean } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getUserId();
    if (!id) {
      router.push("/onboarding");
      return;
    }
    setUid(id);
  }, [router]);

  function toggleSymptom(s: string) {
    if (s === "Something feels different") {
      setShowFeelsDifferent(true);
      return;
    }
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function submit() {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mood,
          energy,
          motivation,
          stress,
          sleepHours,
          symptoms,
          journal,
          workoutTimeMins: workoutTime,
          feelsDifferent: fdCategory ? { category: fdCategory, description: fdDescription } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your check-in.");

      setTodayCheckInId(data.checkIn.id);

      if (data.guidance) {
        setGuidance(data.guidance);
      } else {
        router.push(`/plan?checkInId=${data.checkIn.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (guidance) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20">
        <div className="card">
          <h2 className="font-display text-2xl text-plum-800 mb-4">Thanks for telling us</h2>
          <p className="text-plum-700/70 mb-6 leading-relaxed">{guidance.guidance}</p>
          {guidance.suggestProfessional && (
            <div className="bg-blush-50 border border-blush-200 rounded-xl p-4 text-sm text-plum-700 mb-6">
              This sounds like something worth discussing with a healthcare professional soon. Nourish can't diagnose what's happening, so please don't wait if it feels urgent.
            </div>
          )}
          <button className="btn-primary w-full" onClick={() => router.push(`/plan?checkInId=${getFromStorage()}`)}>
            Continue to today's plan
          </button>
        </div>
      </main>
    );
  }

  function getFromStorage() {
    return typeof window !== "undefined" ? localStorage.getItem("nourish_today_checkin_id") : "";
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl text-plum-800 mb-2">How are you today?</h1>
      <p className="text-plum-700/60 mb-8 text-sm">A quick check-in helps Nourish build today's plan around how you actually feel.</p>

      <div className="card mb-6">
        <Slider label="Mood" value={mood} onChange={setMood} />
        <Slider label="Energy" value={energy} onChange={setEnergy} />
        <Slider label="Motivation" value={motivation} onChange={setMotivation} />
        <Slider label="Stress" value={stress} onChange={setStress} />
        <label className="label">Sleep (hours)</label>
        <input
          type="number"
          step={0.5}
          min={0}
          max={14}
          className="input-field"
          value={sleepHours}
          onChange={(e) => setSleepHours(Number(e.target.value))}
        />
      </div>

      <div className="card mb-6">
        <h3 className="font-display text-lg text-plum-800 mb-3">Symptoms today</h3>
        <ChipSelect options={SYMPTOM_OPTIONS} selected={symptoms} onToggle={toggleSymptom} />

        {showFeelsDifferent && (
          <div className="mt-5 bg-lilac-50 rounded-xl p-4">
            <label className="label">What kind of thing feels different?</label>
            <div className="mb-4">
              <ChipSelect options={FEELS_DIFFERENT_CATEGORIES} selected={fdCategory ? [fdCategory] : []} onToggle={setFdCategory} />
            </div>
            <label className="label">Tell us more (optional but helpful)</label>
            <textarea
              className="input-field"
              rows={3}
              value={fdDescription}
              onChange={(e) => setFdDescription(e.target.value)}
              placeholder="Describe what feels different today..."
            />
            <p className="text-xs text-plum-700/40 mt-2">
              Nourish can't diagnose anything, but this helps it give you appropriate guidance and, if needed, suggest speaking with a professional.
            </p>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <label className="label">Tell Nourish anything else about today</label>
        <textarea
          className="input-field"
          rows={3}
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="e.g. I feel really tired today even though I slept 7 hours."
        />
      </div>

      <div className="card mb-6">
        <h3 className="font-display text-lg text-plum-800 mb-3">How much time do you have to move today?</h3>
        <ChipSelect
          options={TIME_OPTIONS.map((t) => `${t} minutes`)}
          selected={[`${workoutTime} minutes`]}
          onToggle={(v) => setWorkoutTime(parseInt(v))}
        />
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <button className="btn-primary w-full" onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "See today's plan"}
      </button>
    </main>
  );
}
