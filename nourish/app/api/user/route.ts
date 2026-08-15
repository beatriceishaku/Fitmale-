import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ageRange, fitnessGoal, activityLevel, workoutPrefs } = body;

    if (!name || !ageRange || !fitnessGoal || !activityLevel) {
      return NextResponse.json({ error: "Missing required onboarding fields." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        ageRange,
        fitnessGoal,
        activityLevel,
        workoutPrefs: JSON.stringify(workoutPrefs || []),
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("POST /api/user error:", err);
    return NextResponse.json({ error: "Could not create user profile." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { cycle: true, foodPreference: true },
    });

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("GET /api/user error:", err);
    return NextResponse.json({ error: "Could not load user profile." }, { status: 500 });
  }
}
