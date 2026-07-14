"use client";

import Link from "next/link";
import { listSessions } from "@/lib/store";
import { getScenario, TAGLISH_LABELS } from "@/lib/scenarios";
import { useHydrated } from "@/lib/useHydrated";

export default function SessionsPage() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const sessions = listSessions();

  if (sessions.length === 0) {
    return (
      <div className="text-center">
        <p className="opacity-70">No sessions yet.</p>
        <Link href="/" className="mt-2 inline-block text-accent underline">
          Start your first conversation
        </Link>
      </div>
    );
  }

  const learnerTurns = sessions.flatMap((s) =>
    s.transcript.filter((e) => e.speaker === "you" && e.text.trim())
  );
  const wordsProduced = learnerTurns.reduce(
    (n, e) => n + e.text.trim().split(/\s+/).length,
    0
  );
  const minutesSpoken = Math.round(
    sessions.reduce((n, s) => n + (s.endedAt - s.startedAt), 0) / 60000
  );

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Past sessions</h1>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [sessions.length, "conversations"],
          [wordsProduced, "words you spoke"],
          [minutesSpoken, "minutes talking"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-xl border border-black/10 p-3 dark:border-white/10"
          >
            <div className="text-2xl font-semibold text-accent">{value}</div>
            <div className="text-xs opacity-60">{label}</div>
          </div>
        ))}
      </div>
      {sessions.map((s) => {
        const scenario = getScenario(s.scenarioId);
        const minutes = Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
        return (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className="rounded-xl border border-black/10 p-4 transition hover:border-accent dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {scenario?.emoji} {scenario?.title ?? s.scenarioId}
              </span>
              <span className="text-xs opacity-60">
                {new Date(s.startedAt).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-sm opacity-70">
              ~{minutes} min · {TAGLISH_LABELS[s.taglishLevel]} ·{" "}
              {s.feedback ? `${s.feedback.vocab.length} words learned` : "no feedback"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
