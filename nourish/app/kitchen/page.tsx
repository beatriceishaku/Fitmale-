"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipSelect, ErrorBanner } from "@/components/ui";
import { getUserId } from "@/lib/session";

const CATEGORY_CONFIG: { key: string; label: string; options: string[] }[] = [
  { key: "carbohydrate", label: "Carbohydrates", options: ["Rice", "Yam", "Potatoes", "Sweet potatoes", "Plantain", "Pasta", "Bread", "Oats", "Pap"] },
  { key: "protein", label: "Protein", options: ["Eggs", "Chicken", "Fish", "Beef", "Beans", "Lentils", "Greek yogurt"] },
  { key: "vegetable", label: "Vegetables", options: ["Spinach", "Ugu", "Carrot", "Cucumber", "Tomato", "Pepper", "Cabbage"] },
  { key: "fruit", label: "Fruits", options: ["Banana", "Apple", "Orange", "Watermelon", "Pineapple", "Pawpaw", "Mango"] },
  { key: "healthyFat", label: "Healthy fats", options: ["Avocado", "Groundnuts", "Peanut butter", "Seeds", "Olive oil"] },
];

const BUDGETS = ["₦0–₦500", "₦500–₦1,000", "₦1,000–₦2,000", "₦2,000+"];
const COOK_TIMES = [10, 20, 30, 60];

export default function KitchenPage() {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [budgetTier, setBudgetTier] = useState("");
  const [cookingTimeMins, setCookingTimeMins] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUid] = useState<string | null>(null);

  useEffect(() => {
    const id = getUserId();
    if (!id) {
      router.push("/onboarding");
      return;
    }
    setUid(id);
  }, [router]);

  function toggle(category: string, item: string) {
    setSelections((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.includes(item) ? current.filter((i) => i !== item) : [...current, item],
      };
    });
  }

  function addCustom(category: string) {
    const val = (customInputs[category] || "").trim();
    if (!val) return;
    setSelections((prev) => ({ ...prev, [category]: [...(prev[category] || []), val] }));
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));
  }

  async function handleContinue() {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          inventory: selections,
          preferences: { budgetTier, cookingTimeMins },
        }),
      });
      if (!res.ok) throw new Error("Could not save your kitchen. Please try again.");
      router.push("/checkin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl text-plum-800 mb-2">What's in your kitchen?</h1>
      <p className="text-plum-700/60 mb-8 text-sm">
        Nourish prioritizes ingredients you already have — select what's available today.
      </p>

      <div className="space-y-6">
        {CATEGORY_CONFIG.map((cat) => (
          <div className="card" key={cat.key}>
            <h3 className="font-display text-lg text-plum-800 mb-3">{cat.label}</h3>
            <ChipSelect
              options={cat.options}
              selected={selections[cat.key] || []}
              onToggle={(item) => toggle(cat.key, item)}
            />
            <div className="flex gap-2 mt-3">
              <input
                className="input-field text-sm py-2"
                placeholder="Add something else..."
                value={customInputs[cat.key] || ""}
                onChange={(e) => setCustomInputs((p) => ({ ...p, [cat.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addCustom(cat.key)}
              />
              <button type="button" className="btn-secondary py-2 px-4 text-sm" onClick={() => addCustom(cat.key)}>
                Add
              </button>
            </div>
            {(selections[cat.key] || []).filter((s) => !cat.options.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(selections[cat.key] || [])
                  .filter((s) => !cat.options.includes(s))
                  .map((s) => (
                    <span key={s} className="chip chip-active">{s}</span>
                  ))}
              </div>
            )}
          </div>
        ))}

        <div className="card">
          <h3 className="font-display text-lg text-plum-800 mb-3">Budget for today</h3>
          <ChipSelect options={BUDGETS} selected={budgetTier ? [budgetTier] : []} onToggle={(v) => setBudgetTier(v)} />
        </div>

        <div className="card">
          <h3 className="font-display text-lg text-plum-800 mb-3">Cooking time available</h3>
          <ChipSelect
            options={COOK_TIMES.map((t) => `${t} minutes`)}
            selected={cookingTimeMins ? [`${cookingTimeMins} minutes`] : []}
            onToggle={(v) => setCookingTimeMins(parseInt(v))}
          />
        </div>
      </div>

      {error && <div className="mt-6"><ErrorBanner message={error} /></div>}

      <div className="flex justify-end mt-8">
        <button className="btn-primary" onClick={handleContinue} disabled={loading}>
          {loading ? "Saving..." : "Continue to check-in"}
        </button>
      </div>
    </main>
  );
}
