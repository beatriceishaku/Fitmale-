// Demo seed script — creates one demo user with ~10 days of realistic
// check-ins and feedback so the dashboard can show real, data-backed
// "Nourish Learned" patterns during a hackathon demo.
//
// Run with: npm run seed
// Prints the demo user's ID — paste it into localStorage as `nourish_user_id`
// (via devtools) or just sign in fresh and let it accumulate naturally.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Amara (Demo)",
      ageRange: "25-34",
      fitnessGoal: "General wellness",
      activityLevel: "Moderately active",
      workoutPrefs: JSON.stringify(["Walking", "Yoga", "Home"]),
    },
  });

  const lastPeriodStart = new Date();
  lastPeriodStart.setDate(lastPeriodStart.getDate() - 22); // puts "today" around cycle day 23

  await prisma.cycle.create({
    data: {
      userId: user.id,
      lastPeriodStart,
      averageCycleLength: 29,
      periodDuration: 5,
      knowsCycleLength: true,
    },
  });

  await prisma.foodPreference.create({
    data: {
      userId: user.id,
      style: "Nigerian/African",
      budgetTier: "₦1,000–₦2,000",
      cookingTimeMins: 30,
    },
  });

  await prisma.foodInventoryItem.createMany({
    data: [
      { userId: user.id, category: "carbohydrate", name: "Rice" },
      { userId: user.id, category: "carbohydrate", name: "Potatoes" },
      { userId: user.id, category: "protein", name: "Eggs" },
      { userId: user.id, category: "protein", name: "Beans" },
      { userId: user.id, category: "vegetable", name: "Cucumber" },
      { userId: user.id, category: "vegetable", name: "Tomato" },
      { userId: user.id, category: "fruit", name: "Banana" },
      { userId: user.id, category: "healthyFat", name: "Groundnuts" },
    ],
  });

  // 10 days of check-ins: days 14-23 of the cycle, energy/motivation dipping
  // days 21-23, with feedback showing better adherence to short workouts
  // and a preference for lighter meals while bloated.
  const dayOffsets = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0];
  const cycleDays = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  for (let i = 0; i < dayOffsets.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffsets[i]);
    const cycleDay = cycleDays[i];
    const late = cycleDay >= 21;

    const mood = late ? 5 + (i % 2) : 7 + (i % 2);
    const energy = late ? 4 : 7;
    const motivation = late ? 4 : 7;
    const stress = late ? 6 : 4;
    const sleepHours = late ? 6 : 7.5;

    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        date,
        createdAt: date,
        cycleDay,
        mood,
        energy,
        motivation,
        stress,
        sleepHours,
        journal: late ? "Feeling a bit low energy today." : "Feeling pretty good today.",
        workoutTimeMins: late ? 20 : 30,
        symptoms: {
          create: late ? [{ name: "Bloating" }, { name: "Fatigue" }] : [],
        },
      },
    });

    const workout = await prisma.workoutRecommendation.create({
      data: {
        userId: user.id,
        checkInId: checkIn.id,
        title: late ? "Gentle Walk + Stretch" : "Full-Body Strength Circuit",
        durationMinutes: late ? 20 : 30,
        intensity: late ? "low" : "moderate",
        reason: late ? "Lower energy today, so keeping it light." : "Good energy — a fuller session fits well.",
        exercises: JSON.stringify(late ? ["10 min walk", "Stretch"] : ["Squats", "Push-ups", "Plank"]),
        createdAt: date,
      },
    });

    const meal = await prisma.mealRecommendation.create({
      data: {
        userId: user.id,
        checkInId: checkIn.id,
        name: late ? "Light rice & veg bowl" : "Rice, beans & egg plate",
        ingredients: JSON.stringify(late ? ["Rice", "Cucumber", "Tomato"] : ["Rice", "Beans", "Eggs"]),
        instructions: JSON.stringify(["Cook", "Combine", "Serve"]),
        estimatedTimeMinutes: 25,
        estimatedBudget: "₦1,000–₦2,000",
        reason: "Built from ingredients on hand.",
        createdAt: date,
      },
    });

    await prisma.feedback.create({
      data: {
        userId: user.id,
        type: "workout",
        rating: "loved_it",
        workoutId: workout.id,
        createdAt: date,
      },
    });

    await prisma.feedback.create({
      data: {
        userId: user.id,
        type: "meal",
        rating: late ? "loved_it" : "okay",
        mealId: meal.id,
        createdAt: date,
      },
    });
  }

  console.log("Seeded demo user:", user.id);
  console.log("In your browser devtools console on the app, run:");
  console.log(`  localStorage.setItem('nourish_user_id', '${user.id}')`);
  console.log("then visit /dashboard to see the demo patterns.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
