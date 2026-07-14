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

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Past sessions</h1>
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
