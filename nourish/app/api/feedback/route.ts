import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, rating, note, workoutId, mealId, recoveryId } = body;

    if (!userId || !type || !rating) {
      return NextResponse.json({ error: "userId, type, and rating are required." }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: { userId, type, rating, note: note || null, workoutId, mealId, recoveryId },
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}
