import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCycleDay } from "@/lib/cycle";
import { generateWellnessGuidance } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      mood,
      energy,
      motivation,
      stress,
      sleepHours,
      symptoms,
      journal,
      workoutTimeMins,
      feelsDifferent, // { category, description } | null
    } = body;

    if (!userId || mood == null || energy == null || motivation == null || stress == null) {
      return NextResponse.json({ error: "Missing required check-in fields." }, { status: 400 });
    }

    const cycle = await prisma.cycle.findUnique({ where: { userId } });
    const cycleDay = cycle ? getCycleDay(cycle) : null;

    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId,
        cycleDay,
        mood,
        energy,
        motivation,
        stress,
        sleepHours: sleepHours ?? 0,
        journal: journal || null,
        workoutTimeMins: workoutTimeMins || 20,
        feelsDifferent: feelsDifferent ? JSON.stringify(feelsDifferent) : null,
        symptoms: {
          create: (symptoms || []).map((name: string) => ({ name })),
        },
      },
      include: { symptoms: true },
    });

    let guidance = null;
    if (feelsDifferent?.description) {
      guidance = await generateWellnessGuidance(feelsDifferent.category, feelsDifferent.description);
    }

    return NextResponse.json({ checkIn, guidance });
  } catch (err) {
    console.error("POST /api/checkin error:", err);
    return NextResponse.json({ error: "Could not save check-in." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { userId },
      include: { symptoms: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return NextResponse.json({ checkIns });
  } catch (err) {
    console.error("GET /api/checkin error:", err);
    return NextResponse.json({ error: "Could not load check-ins." }, { status: 500 });
  }
}
