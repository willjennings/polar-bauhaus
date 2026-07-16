"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { addVocab, getSession, saveSession } from "@/lib/store";
import { TAGLISH_LABELS } from "@/lib/scenarios";
import { resolveScenario } from "@/lib/curriculum";
import { useHydrated } from "@/lib/useHydrated";
import FeedbackReport from "@/app/components/FeedbackReport";
import type { Correction, Feedback } from "@/lib/types";
import {
  loadLearnerState,
  saveLearnerState,
  recordCorrections,
  applyReviewResults,
  foldVocabIntoSrs,
  updateSessionLogEntry,
  dismissCorrection,
} from "@/lib/learner";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  // Bumped after a feedback retry or a correction dismissal so the page re-reads the saved record.
  const [, setVersion] = useState(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "error">("idle");

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
  const hasLearnerSpeech = record.transcript.some((e) => e.speaker === "you" && e.text.trim());
  const canRetryFeedback = record.feedback === null && hasLearnerSpeech;

  const generateFeedback = async () => {
    setFeedbackState("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: record.transcript,
          mode: record.mode ?? "free",
          currentUnit: record.unitId,
          reviewItems: record.reviewItems,
        }),
      });
      if (!res.ok) throw new Error();
      const { feedback: fb } = (await res.json()) as { feedback: Feedback };

      saveSession({ ...record, feedback: fb });
      addVocab(
        fb.vocab.map((v) => ({ ...v, scenarioId: record.scenarioId, addedAt: Date.now() }))
      );

      // Mirrors the practice page's success-path learner-state update; a
      // failure here shouldn't hide the feedback that already saved fine.
      try {
        let learner = loadLearnerState();
        const now = Date.now();
        const unitId = record.unitId ?? learner.currentUnit;
        learner = recordCorrections(
          learner,
          fb.corrections.map((c) => ({ learnerSaid: c.youSaid, target: c.better, patternTag: c.patternTag })),
          unitId,
          now
        );
        if (fb.reviewResults) learner = applyReviewResults(learner, fb.reviewResults, now);
        learner = foldVocabIntoSrs(learner, fb.vocab.map((v) => v.tagalog), now);
        learner = updateSessionLogEntry(learner, record.startedAt, {
          corrections: fb.corrections.length,
          drillScores: fb.drillScores
            ? Object.fromEntries(fb.drillScores.map((d) => [d.targetId, d.score]))
            : undefined,
        });
        saveLearnerState(learner);
      } catch (err) {
        console.error("learner state update failed:", err);
      }

      setFeedbackState("idle");
      setVersion((v) => v + 1);
    } catch {
      setFeedbackState("error");
    }
  };

  const handleDismiss = (c: Correction) => {
    const isSame = (x: Correction) => x.youSaid === c.youSaid && x.better === c.better && x.note === c.note;
    try {
      let learner = loadLearnerState();
      learner = dismissCorrection(learner, c.patternTag ?? "", c.youSaid);
      saveLearnerState(learner);
    } catch (err) {
      console.error("dismissCorrection failed:", err);
    }
    if (record.feedback) {
      saveSession({
        ...record,
        feedback: { ...record.feedback, corrections: record.feedback.corrections.filter((x) => !isSame(x)) },
      });
    }
    setVersion((v) => v + 1);
  };

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

      {record.feedback && <FeedbackReport feedback={record.feedback} onDismiss={handleDismiss} />}

      {canRetryFeedback && (
        <div className="rounded-xl border border-black/10 p-4 text-center dark:border-white/10">
          {feedbackState === "loading" ? (
            <p className="animate-pulse text-sm opacity-70">Salamat! Reviewing your conversation…</p>
          ) : (
            <>
              {feedbackState === "error" && (
                <p className="mb-2 text-sm text-red-600 dark:text-red-400">
                  Couldn&apos;t generate feedback — try again?
                </p>
              )}
              <button
                onClick={generateFeedback}
                className="rounded-full bg-(--accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                ✨ Generate feedback
              </button>
            </>
          )}
        </div>
      )}

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
