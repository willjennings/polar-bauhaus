"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getSession } from "@/lib/store";
import { TAGLISH_LABELS } from "@/lib/scenarios";
import { resolveScenario } from "@/lib/curriculum";
import { useHydrated } from "@/lib/useHydrated";
import FeedbackReport from "@/app/components/FeedbackReport";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();

  if (!hydrated) return null;
  const record = getSession(id) ?? null;
  if (record === null) {
    return (
      <p>
        Session not found.{" "}
        <Link href="/sessions" className="text-accent underline">
          Back to sessions
        </Link>
      </p>
    );
  }

  const scenario = resolveScenario(record.scenarioId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">
          {scenario?.emoji} {scenario?.title ?? record.scenarioId}
        </h1>
        <p className="text-sm opacity-70">
          {new Date(record.startedAt).toLocaleString()} · {TAGLISH_LABELS[record.taglishLevel]}
        </p>
      </div>

      {record.feedback && <FeedbackReport feedback={record.feedback} />}

      <div>
        <h2 className="mb-2 font-semibold">Transcript</h2>
        <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/10">
          {record.transcript.map((e) => (
            <div key={e.id} className={e.speaker === "you" ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  e.speaker === "you"
                    ? "bg-(--accent) text-white"
                    : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {e.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
