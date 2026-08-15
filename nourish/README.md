# Fitmale 

AI-powered women's adaptive wellness companion cycle-aware, but personalized
to how you actually feel today, not a generic phase template.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind · Prisma + SQLite · Gemini API · Recharts

## Quick start (run this locally — do it now, first)

```bash
npm install
cp .env.local.example .env.local
# open .env.local and paste your Gemini API key (get one free at https://aistudio.google.com/apikey)

npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000. Without a `GEMINI_API_KEY`, the app still fully works —
`lib/ai-service.ts` automatically falls back to a rule-based plan generator, so you
can demo the whole flow even if Gemini is rate-limited or the key isn't set yet.

## Seeding demo data (for your hackathon demo's "wow" moment)

```bash
npm run seed
```

This creates a demo user with 10 days of realistic check-ins (energy/motivation
dipping on cycle days 21–23, consistent short-workout completion, lighter meals
during bloating) — enough data for `/dashboard` to show real "Nourish Learned"
patterns immediately, instead of the "keep checking in" placeholder.

The script prints a line like:
```
localStorage.setItem('nourish_user_id', 'clxxxxx...')
```
Paste that into your browser's devtools console on `localhost:3000`, then visit
`/dashboard`.

## The core flow

```
/ (landing) → /onboarding → /kitchen → /checkin → /plan → /dashboard
```

- **`/onboarding`** — personal info, workout style, cycle setup ("I know my cycle
  length" vs "I'm not sure"), food preferences.
- **`/kitchen`** — ingredient selection by food class + budget + cook time.
- **`/checkin`** — mood/energy/motivation/stress/sleep sliders, symptoms, journal,
  available workout time, and the "Something feels different" flow (non-diagnostic
  guidance, escalates to "see a professional" language only when warranted).
- **`/plan`** — calls `/api/recommendations`, which builds a structured context
  object from the DB (cycle day, check-in, kitchen, prior patterns, prior feedback)
  and sends it to Gemini asking for strict JSON matching the schema in
  `lib/ai-service.ts`. Response is validated; malformed responses trigger the
  fallback generator instead of a blank/broken screen. Shows Move / Eat / Reset
  with feedback buttons and "Try another meal."
- **`/dashboard`** — weekly mood/energy/motivation/sleep charts (Recharts), cycle
  day + estimated next period (always labeled "estimated"), and "Nourish Learned"
  — patterns only surface once `lib/patterns.ts` finds ≥5 check-ins and a real
  statistical difference; otherwise it honestly says it needs more data.

## Where things live

- `lib/ai-service.ts` — the whole AI personalization engine: prompt construction,
  the JSON schema contract, response validation, and the fallback plan.
- `lib/cycle.ts` — cycle-day math, always using the user's own recorded average
  cycle length, never a hardcoded 28 days.
- `lib/patterns.ts` — rule-based pattern detection, deliberately conservative.
- `prisma/schema.prisma` — full data model (User, Cycle, DailyCheckIn, Symptom,
  FoodInventoryItem, FoodPreference, WorkoutRecommendation, MealRecommendation,
  RecoveryRecommendation, Feedback, WellnessPattern).
- `app/api/**` — all server routes; the Gemini key is only ever read server-side
  in `lib/ai-service.ts` and is never sent to the client.

## Deploying to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel
```

Then in the Vercel project settings, add environment variables:
- `GEMINI_API_KEY`
- `DATABASE_URL` — SQLite works locally, but Vercel's filesystem is ephemeral/read-only
  in production. For the demo deploy, the fastest fix is swapping `DATABASE_URL` to a
  hosted Postgres URL (e.g. a free [Neon](https://neon.tech) or [Supabase](https://supabase.com)
  instance) and changing `provider = "sqlite"` to `provider = "postgresql"` in
  `prisma/schema.prisma`, then `npx prisma migrate deploy`. If you're demoing from
  `localhost` instead of a live URL, you can skip this and just use SQLite as-is.

## Notes on scope (P0/P1 from the spec)

Built: landing, onboarding, cycle calc, check-in, kitchen, AI daily plan
(workout/meal/recovery), feedback, "try another meal," dashboard with charts,
pattern detection, "something feels different" flow, demo seed data.

Not built (P2, intentionally deferred per the hackathon priority list): auth,
notifications, full monthly calendar grid UI (the `getCalendarMonth` helper in
`lib/cycle.ts` is ready for it if there's time left), grocery list, social features.

There's no authentication — the current user's ID is kept in `localStorage`
(`lib/session.ts`). Fine for an MVP demo; swap for real auth before any real launch.
