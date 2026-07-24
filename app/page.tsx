"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SCENARIOS, TAGLISH_LABELS } from "@/lib/scenarios";
import { getUnit } from "@/lib/curriculum";
import { activeSrsKeys, loadLearnerState } from "@/lib/learner";
import { dueCount } from "@/lib/srs";
import { listVocab } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

const DAY_MS = 24 * 60 * 60 * 1000;

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

      {hydrated && (() => {
        const learner = loadLearnerState();
        const unit = getUnit(learner.currentUnit);
        const now = Date.now();
        const replaced = new Set(
          listVocab()
            .filter((v) => v.familyVerified === "replaced")
            .map((v) => v.tagalog.toLowerCase())
        );
        const dueTotal = dueCount(activeSrsKeys(learner.vocabSrs, replaced), now);
        const lastTs =
          learner.sessionLog.length > 0
            ? Math.max(...learner.sessionLog.map((s) => s.ts))
            : null;
        const daysAgo = lastTs === null ? null : Math.floor((now - lastTs) / DAY_MS);
        const sessionsThisWeek = learner.sessionLog.filter((s) => now - s.ts <= 7 * DAY_MS).length;
        return (
          <div className="flex flex-col gap-1.5">
            {unit && (
              <Link
                href="/curriculum"
                className="rounded-xl border border-black/10 p-4 transition hover:border-accent dark:border-white/10"
              >
                <span className="text-sm opacity-70">Now learning</span>
                <div className="font-semibold">
                  {unit.id} — {unit.title}
                </div>
              </Link>
            )}
            <p className="text-xs opacity-60">
              ⚡ {dueTotal} words due · last session{" "}
              {daysAgo === null ? "never" : daysAgo === 0 ? "today" : `${daysAgo} days ago`} ·{" "}
              {sessionsThisWeek} sessions this week
            </p>
          </div>
        );
      })()}

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
