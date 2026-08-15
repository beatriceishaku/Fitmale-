import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, inventory, preferences } = body;
    // inventory: { carbohydrate: string[], protein: string[], vegetable: string[], fruit: string[], healthyFat: string[] }
    // preferences: { style, allergies, dislikes, restrictions, budgetTier, cookingTimeMins }

    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    await prisma.foodInventoryItem.deleteMany({ where: { userId } });

    const items: { userId: string; category: string; name: string }[] = [];
    for (const [category, names] of Object.entries(inventory || {})) {
      for (const name of names as string[]) {
        if (name && name.trim()) items.push({ userId, category, name: name.trim() });
      }
    }
    if (items.length) {
      await prisma.foodInventoryItem.createMany({ data: items });
    }

    let foodPreference = null;
    if (preferences) {
      foodPreference = await prisma.foodPreference.upsert({
        where: { userId },
        update: {
          style: preferences.style || "mixed",
          allergies: preferences.allergies || null,
          dislikes: preferences.dislikes || null,
          restrictions: preferences.restrictions || null,
          budgetTier: preferences.budgetTier || null,
          cookingTimeMins: preferences.cookingTimeMins || null,
        },
        create: {
          userId,
          style: preferences.style || "mixed",
          allergies: preferences.allergies || null,
          dislikes: preferences.dislikes || null,
          restrictions: preferences.restrictions || null,
          budgetTier: preferences.budgetTier || null,
          cookingTimeMins: preferences.cookingTimeMins || null,
        },
      });
    }

    const savedInventory = await prisma.foodInventoryItem.findMany({ where: { userId } });
    return NextResponse.json({ inventory: savedInventory, foodPreference });
  } catch (err) {
    console.error("POST /api/kitchen error:", err);
    return NextResponse.json({ error: "Could not save kitchen information." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const [inventory, foodPreference] = await Promise.all([
      prisma.foodInventoryItem.findMany({ where: { userId } }),
      prisma.foodPreference.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({ inventory, foodPreference });
  } catch (err) {
    console.error("GET /api/kitchen error:", err);
    return NextResponse.json({ error: "Could not load kitchen information." }, { status: 500 });
  }
}
