"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, TAGLISH_LABELS } from "@/lib/scenarios";
import { useHydrated } from "@/lib/useHydrated";

const TAGLISH_KEY = "kausap.taglishLevel";

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [override, setOverride] = useState<number | null>(null);
  const stored = hydrated ? Number(window.localStorage.getItem(TAGLISH_KEY)) || 3 : 3;
  const level = override ?? stored;

  const setAndSaveLevel = (value: number) => {
    setOverride(value);
    window.localStorage.setItem(TAGLISH_KEY, String(value));
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold">Pick a scene, then just talk.</h1>
        <p className="mt-1 text-sm opacity-70">
          Your kausap stays in character, helps when you&apos;re stuck, and debriefs you after.
        </p>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-baseline justify-between">
          <label htmlFor="taglish" className="font-medium">
            Taglish dial
          </label>
          <span className="text-sm text-accent-warm font-medium">{TAGLISH_LABELS[level]}</span>
        </div>
        <input
          id="taglish"
          type="range"
          min={1}
          max={5}
          step={1}
          value={level}
          onChange={(e) => setAndSaveLevel(Number(e.target.value))}
          className="mt-3 w-full accent-(--accent)"
        />
        <div className="mt-1 flex justify-between text-xs opacity-60">
          <span>More English, slower</span>
          <span>Full Tagalog, native speed</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/practice/${s.id}?level=${level}`)}
            className="rounded-xl border border-black/10 p-4 text-left transition hover:border-accent hover:shadow-sm dark:border-white/10"
          >
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-2 font-semibold">{s.title}</div>
            <div className="mt-1 text-sm opacity-70">{s.description}</div>
          </button>
        ))}
      </section>
    </div>
  );
}
