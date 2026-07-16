"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CURRICULUM, defaultLevelForUnit, getUnit, pickSeed, unitIndex } from "@/lib/curriculum";
import { activeSrsKeys, advanceUnit, canAdvance, loadLearnerState, saveLearnerState, type LearnerState } from "@/lib/learner";
import { buildStatusMarkdown } from "@/lib/exportStatus";
import { useHydrated } from "@/lib/useHydrated";
import { dueItems } from "@/lib/srs";
import { listVocab } from "@/lib/store";
import { buildBackup, restoreBackup, serializeBackup } from "@/lib/backup";
import { computeTrends } from "@/lib/trends";

export default function CurriculumPage() {
  const hydrated = useHydrated();
  const [state, setState] = useState<LearnerState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const learner = state ?? (hydrated ? loadLearnerState() : null);
  if (!learner) return <p className="animate-pulse text-sm opacity-60">Loading…</p>;

  const unit = getUnit(learner.currentUnit) ?? CURRICULUM[0];
  const currentIdx = unitIndex(learner.currentUnit);
  const gate = canAdvance(learner);
  const checks = learner.canDoChecks[unit.id] ?? unit.canDo.map(() => false);
  const nextSeed = pickSeed(unit.id, learner.lastSeedId);
  const level = defaultLevelForUnit(unit.id);
  const replacedVocab = new Set(
    listVocab()
      .filter((v) => v.familyVerified === "replaced")
      .map((v) => v.tagalog.toLowerCase())
  );
  const hasDue = dueItems(activeSrsKeys(learner.vocabSrs, replacedVocab), Date.now(), 1).length > 0;

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

  const backup = () => {
    const json = serializeBackup(buildBackup(Date.now()));
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `kausap-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file: File) => {
    try {
      const text = await file.text();
      const result = restoreBackup(text, Date.now());
      if (result.ok) {
        window.alert(result.summary);
        setState(loadLearnerState());
      } else {
        window.alert(`Restore failed: ${result.error}`);
      }
    } catch (err) {
      window.alert(`Restore failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Curriculum</h1>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(buildStatusMarkdown(learner, Date.now()));
          } catch {
            window.alert("Copy failed — select and copy manually.");
            return;
          }
          window.alert("Status copied — paste it into a Claude chat.");
        }}
        className="self-start rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
      >
        📤 Share status with Claude
      </button>

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
          {nextSeed && hasDue && (
            <Link
              href={`/practice/seed?seed=${nextSeed.id}&mode=review&level=${level}`}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
            >
              ⚡ Review sprint
            </Link>
          )}
          <Link
            href="/lia-prep"
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            🍽️ Lia Prep
          </Link>
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
            disabled={!gate.ok || learner.completedUnits.includes(unit.id)}
            className="rounded-full bg-(--accent) px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {currentIdx === CURRICULUM.length - 1 ? "Complete final unit ✓" : "Advance ➜"}
          </button>
          {!gate.ok && !learner.completedUnits.includes(unit.id) && (
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

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Trends (last 12 weeks)</h2>
        {(() => {
          const trends = computeTrends(learner.sessionLog, Date.now()).map((w, i, arr) => ({
            ...w,
            weeksAgo: arr.length - 1 - i,
          }));
          const firstNonEmpty = trends.findIndex((w) => w.sessions > 0);
          const visible = firstNonEmpty === -1 ? [] : trends.slice(firstNonEmpty);
          if (visible.length === 0) {
            return <p className="mt-2 text-sm opacity-60">No sessions logged yet.</p>;
          }
          return (
            <ul className="mt-3 flex flex-col gap-2">
              {visible.map((t) => (
                <li key={t.weekStart} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="w-14 shrink-0 font-medium opacity-70">W-{t.weeksAgo}</span>
                  <span className="w-20 shrink-0 opacity-80">{t.sessions} sessions</span>
                  <span className="w-16 shrink-0 opacity-80">{t.minutes}m</span>
                  {t.talkRatio !== null && (
                    <span className="w-28 shrink-0 opacity-80">
                      you spoke {Math.round(t.talkRatio * 100)}%
                    </span>
                  )}
                  {t.correctionsPer100 !== null && (
                    <span className="w-28 shrink-0 opacity-80">
                      {t.correctionsPer100.toFixed(1)} corr/100w
                    </span>
                  )}
                  {t.lifelinesPerSession !== null && (
                    <span className="opacity-80">
                      {t.lifelinesPerSession.toFixed(1)} lifelines/session
                    </span>
                  )}
                  {t.talkRatio !== null && (
                    <div className="h-1.5 w-full basis-full rounded-full bg-black/10 dark:bg-white/10 sm:basis-24 sm:flex-1">
                      <div
                        className="h-1.5 rounded-full bg-(--accent)"
                        style={{ width: `${Math.round(t.talkRatio * 100)}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Data</h2>
        <p className="mt-1 text-sm opacity-70">
          Back up your sessions, vocab, and progress, or merge in a backup from another device.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={backup}
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            ⬇ Back up everything
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            ⬆ Restore / merge backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void restore(file);
            }}
          />
        </div>
      </section>
    </div>
  );
}
