"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Spinner, ErrorBanner } from "@/components/ui";
import { getUserId } from "@/lib/session";

interface CheckInSummary {
  id: string;
  date: string;
  cycleDay: number | null;
  mood: number;
  energy: number;
  motivation: number;
  stress: number;
  sleepHours: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIns, setCheckIns] = useState<CheckInSummary[]>([]);
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [patternData, setPatternData] = useState<any>(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      router.push("/onboarding");
      return;
    }
    load(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(userId: string) {
    setLoading(true);
    setError("");
    try {
      const [checkInsRes, cycleRes, patternsRes] = await Promise.all([
        fetch(`/api/checkin?userId=${userId}`),
        fetch(`/api/cycle?userId=${userId}`),
        fetch(`/api/patterns?userId=${userId}`),
      ]);
      const checkInsData = await checkInsRes.json();
      const cycleData = cycleRes.ok ? await cycleRes.json() : null;
      const patternsData = await patternsRes.json();

      const rows: CheckInSummary[] = (checkInsData.checkIns || [])
        .slice()
        .reverse()
        .map((c: any) => ({
          id: c.id,
          date: new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          cycleDay: c.cycleDay,
          mood: c.mood,
          energy: c.energy,
          motivation: c.motivation,
          stress: c.stress,
          sleepHours: c.sleepHours,
        }));

      setCheckIns(rows);
      setCycleInfo(cycleData);
      setPatternData(patternsData);
    } catch (err: any) {
      setError("Could not load your dashboard right now.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner label="Loading your dashboard..." />;

  const today = checkIns[checkIns.length - 1];

  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-plum-800">Your dashboard</h1>
        <Link href="/checkin" className="btn-secondary text-sm py-2 px-4">New check-in</Link>
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      {checkIns.length === 0 ? (
        <div className="card text-center">
          <p className="text-plum-700/70 mb-4">No check-ins yet — start with today's to see your first plan and dashboard.</p>
          <Link href="/checkin" className="btn-primary">Check in now</Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-plum-700/40 mb-1">Cycle day</p>
              <p className="font-display text-2xl text-plum-800">{cycleInfo?.cycleDay ?? "—"}</p>
              {cycleInfo?.estimatedNextPeriod && (
                <p className="text-xs text-plum-700/40 mt-1">
                  Est. next period: {new Date(cycleInfo.estimatedNextPeriod).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-plum-700/40 mb-1">Today's mood</p>
              <p className="font-display text-2xl text-plum-800">{today?.mood ?? "—"}/10</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-plum-700/40 mb-1">Today's energy</p>
              <p className="font-display text-2xl text-plum-800">{today?.energy ?? "—"}/10</p>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="font-display text-xl text-plum-800 mb-4">Weekly trends</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={checkIns.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33173512" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#331F3580" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#331F3580" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="mood" stroke="#AB86D2" strokeWidth={2} />
                <Line type="monotone" dataKey="energy" stroke="#557A59" strokeWidth={2} />
                <Line type="monotone" dataKey="motivation" stroke="#E27680" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card mb-8">
            <h2 className="font-display text-xl text-plum-800 mb-4">Sleep</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={checkIns.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33173512" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#331F3580" }} />
                <YAxis tick={{ fontSize: 12, fill: "#331F3580" }} />
                <Tooltip />
                <Line type="monotone" dataKey="sleepHours" stroke="#8F63BD" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="font-display text-xl text-plum-800 mb-1">Nourish Learned</h2>
            <p className="text-sm text-plum-700/50 mb-4">
              {patternData?.checkInCount ?? checkIns.length} check-ins recorded
              {patternData?.minimumRequired ? ` (${patternData.minimumRequired} needed for reliable patterns)` : ""}.
            </p>
            {patternData?.patterns?.length ? (
              <ul className="space-y-3">
                {patternData.patterns.map((p: any, i: number) => (
                  <li key={i} className="bg-lilac-50 rounded-xl p-4 text-sm text-plum-700/80">
                    {p.description}
                    <span className="block text-xs text-plum-700/40 mt-1 capitalize">{p.confidence} confidence</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-plum-700/60">{patternData?.message}</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
