import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectPatterns } from "@/lib/patterns";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const [checkIns, feedback] = await Promise.all([
      prisma.dailyCheckIn.findMany({
        where: { userId },
        select: { cycleDay: true, mood: true, energy: true, motivation: true, sleepHours: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.feedback.findMany({
        where: { userId },
        select: { type: true, rating: true },
      }),
    ]);

    const result = detectPatterns(checkIns, feedback);

    // Persist newly-detected patterns so the AI service can reference them later.
    if (result.patterns.length) {
      for (const p of result.patterns) {
        const existing = await prisma.wellnessPattern.findFirst({
          where: { userId, category: p.category, description: p.description },
        });
        if (!existing) {
          await prisma.wellnessPattern.create({
            data: { userId, category: p.category, description: p.description, confidence: p.confidence },
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/patterns error:", err);
    return NextResponse.json({ error: "Could not load patterns." }, { status: 500 });
  }
}
