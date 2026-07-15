"use client";

import { useState } from "react";
import Link from "next/link";
import { CURRICULUM, defaultLevelForUnit, getUnit, pickSeed, unitIndex } from "@/lib/curriculum";
import { advanceUnit, canAdvance, loadLearnerState, saveLearnerState, type LearnerState } from "@/lib/learner";
import { useHydrated } from "@/lib/useHydrated";

export default function CurriculumPage() {
  const hydrated = useHydrated();
  const [state, setState] = useState<LearnerState | null>(null);
  const learner = state ?? (hydrated ? loadLearnerState() : null);
  if (!learner) return <p className="animate-pulse text-sm opacity-60">Loading…</p>;

  const unit = getUnit(learner.currentUnit)!;
  const currentIdx = unitIndex(learner.currentUnit);
  const gate = canAdvance(learner);
  const checks = learner.canDoChecks[unit.id] ?? unit.canDo.map(() => false);
  const nextSeed = pickSeed(unit.id, learner.lastSeedId);
  const level = defaultLevelForUnit(unit.id);

  const update = (next: LearnerState) => {
    saveLearnerState(next);
    setState(next);
  };

  const toggleCanDo = (i: number) => {
    const nextChecks = [...checks];
    nextChecks[i] = !nextChecks[i];
    update({ ...learner, canDoChecks: { ...learner.canDoChecks, [unit.id]: nextChecks } });
  };

  const advance = (override: boolean) => {
    if (override && !window.confirm("Force-advance past the gate? This will be logged.")) return;
    update(advanceUnit(learner, { override, ts: Date.now() }));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Curriculum</h1>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">
          Now learning: {unit.id} — {unit.title}
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {unit.grammarTargets.map((t) => (
            <li key={t.id}>
              <span className="font-medium">{t.id}</span>: {t.pattern}
              <span className="opacity-60"> — {t.exampleFrames.join(" · ")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm opacity-70">Vocab: {unit.vocab.map((v) => v.tl).join(", ")}</p>
        <p className="mt-1 text-sm opacity-70">{unit.registerNotes.join(" ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextSeed && (
            <Link
              href={`/practice/seed?seed=${nextSeed.id}&mode=target&level=${level}`}
              className="rounded-full bg-(--accent) px-4 py-1.5 text-sm text-white"
            >
              🎬 Start Target Scene — {nextSeed.setting}
            </Link>
          )}
          {nextSeed && (
            <Link
              href={`/practice/seed?seed=${nextSeed.id}&mode=review&level=${level}`}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
            >
              ⚡ Review sprint
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Can-do checklist</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {unit.canDo.map((c, i) => (
            <li key={c}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checks[i] ?? false} onChange={() => toggleCanDo(i)} />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Advance to the next unit</h2>
        {gate.ok ? (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">Gate open — solid work.</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm opacity-80">
            {gate.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => advance(false)}
            disabled={!gate.ok || currentIdx === CURRICULUM.length - 1}
            className="rounded-full bg-(--accent) px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Advance ➜
          </button>
          {!gate.ok && currentIdx < CURRICULUM.length - 1 && (
            <button
              onClick={() => advance(true)}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm opacity-70 dark:border-white/20"
            >
              Force-advance (logged)
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">All units</h2>
        <ol className="mt-2 space-y-1 text-sm">
          {CURRICULUM.map((u, i) => (
            <li
              key={u.id}
              className={
                i === currentIdx
                  ? "font-semibold text-accent"
                  : i < currentIdx
                    ? "opacity-60 line-through"
                    : "opacity-60"
              }
            >
              {u.id} — {u.title}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
