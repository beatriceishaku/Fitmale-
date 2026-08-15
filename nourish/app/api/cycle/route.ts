import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCycleDay, getEstimatedNextPeriod, getCyclePhaseLabel } from "@/lib/cycle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, lastPeriodStart, averageCycleLength, periodDuration, knowsCycleLength } = body;

    if (!userId || !lastPeriodStart) {
      return NextResponse.json({ error: "userId and lastPeriodStart are required." }, { status: 400 });
    }

    const cycle = await prisma.cycle.upsert({
      where: { userId },
      update: {
        lastPeriodStart: new Date(lastPeriodStart),
        averageCycleLength: averageCycleLength || 28,
        periodDuration: periodDuration || 5,
        knowsCycleLength: knowsCycleLength ?? true,
      },
      create: {
        userId,
        lastPeriodStart: new Date(lastPeriodStart),
        averageCycleLength: averageCycleLength || 28,
        periodDuration: periodDuration || 5,
        knowsCycleLength: knowsCycleLength ?? true,
      },
    });

    return NextResponse.json({ cycle });
  } catch (err) {
    console.error("POST /api/cycle error:", err);
    return NextResponse.json({ error: "Could not save cycle information." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const cycle = await prisma.cycle.findUnique({ where: { userId } });
    if (!cycle) return NextResponse.json({ error: "No cycle info found for this user." }, { status: 404 });

    const cycleDay = getCycleDay(cycle);
    const phase = getCyclePhaseLabel(cycle);
    const estimatedNextPeriod = getEstimatedNextPeriod(cycle);

    return NextResponse.json({ cycle, cycleDay, phase, estimatedNextPeriod });
  } catch (err) {
    console.error("GET /api/cycle error:", err);
    return NextResponse.json({ error: "Could not load cycle information." }, { status: 500 });
  }
}
