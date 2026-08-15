import Link from "next/link";

const features = [
  { title: "Cycle-aware", desc: "Understands where you are in your cycle without boxing you into a generic template." },
  { title: "AI-personalized", desc: "Reads your mood, energy, stress, and sleep to shape today's plan — not a static one." },
  { title: "Adaptive workouts", desc: "Strength on strong days, gentle movement on lower-energy days. You're never guilted." },
  { title: "Real meals from what you have", desc: "Uses ingredients already in your kitchen, respecting your budget and time." },
  { title: "Recovery, built in", desc: "Stretching, breathing, rest — recommended based on your stress and mood." },
  { title: "Learns your patterns", desc: "Surfaces real, data-backed insights about you — never invented ones." },
];

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blush-100 blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-lilac-100 blur-3xl opacity-60" />
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/80 text-plum-700 text-xs font-semibold tracking-wide uppercase shadow-soft mb-6">
            Nourish
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-plum-800 leading-tight mb-5">
            Your cycle is unique.
            <br />
            Your wellness should be too.
          </h1>
          <p className="text-plum-700/70 text-lg mb-10 max-w-xl mx-auto">
            An AI-powered wellness companion that learns your patterns and helps you move, eat,
            recover, and feel better throughout your month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding" className="btn-primary">
              Start My Wellness Journey
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              How Nourish Works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl text-plum-800 text-center mb-3">
          Not a period tracker. Not a chatbot.
        </h2>
        <p className="text-plum-700/60 text-center max-w-xl mx-auto mb-12">
          Nourish combines your cycle, how you actually feel today, and what's realistically
          available to you — then learns what works for you specifically.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-display text-lg text-plum-800 mb-2">{f.title}</h3>
              <p className="text-sm text-plum-700/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="card bg-plum-800 text-cream">
          <h2 className="font-display text-2xl mb-3">Check in. Move. Eat. Reset. Learn.</h2>
          <p className="text-cream/70 mb-6 text-sm">
            A few minutes a day is all it takes for Nourish to start noticing what actually works
            for you.
          </p>
          <Link href="/onboarding" className="inline-block bg-blush-300 text-plum-900 font-medium rounded-full px-6 py-3 hover:bg-blush-200 transition">
            Start My Wellness Journey
          </Link>
        </div>
      </section>
    </main>
  );
}
