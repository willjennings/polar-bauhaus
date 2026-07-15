"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getScenario, TAGLISH_LABELS, VOICES } from "@/lib/scenarios";
import { RealtimeSession, type SessionStatus } from "@/lib/realtime";
import { addVocab, listVocab, saveSession } from "@/lib/store";
import type { Feedback, SessionRecord, TranscriptEntry } from "@/lib/types";
import FeedbackReport from "@/app/components/FeedbackReport";
import { getSeed, seedToScenario } from "@/lib/curriculum";
import {
  loadLearnerState, saveLearnerState, recordCorrections, logSession,
  applyReviewResults, topErrorTags, type Mode,
} from "@/lib/learner";
import { dueItems } from "@/lib/srs";

export default function PracticePage() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}

function Practice() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const searchParams = useSearchParams();
  const taglishLevel = Math.min(5, Math.max(1, Number(searchParams.get("level")) || 3));

  const seedId = searchParams.get("seed");
  const seedHit = seedId ? getSeed(seedId) : undefined;
  const scenario = seedHit ? seedToScenario(seedHit.seed, seedHit.unit) : getScenario(scenarioId);

  const modeParam = searchParams.get("mode");
  const mode: Mode = modeParam === "target" || modeParam === "review" ? modeParam : "free";

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [voice, setVoice] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState("");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "done" | "error" | "skipped">("idle");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const entriesRef = useRef<TranscriptEntry[]>([]);
  const startedAtRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const reviewItemsRef = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    entriesRef.current = entries;
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    return () => sessionRef.current?.disconnect();
  }, []);

  const session = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new RealtimeSession({
      onStatus: (s, detail) => {
        setStatus(s);
        setStatusDetail(detail ?? "");
      },
      onTranscript: (entry) => {
        setEntries((prev) => {
          const i = prev.findIndex((e) => e.id === entry.id);
          if (i === -1) return [...prev, entry];
          const next = [...prev];
          next[i] = entry.final
            ? entry
            : { ...next[i], text: next[i].text + entry.text };
          return next;
        });
      },
    });
  }, []);

  if (!scenario) {
    return (
      <p>
        Unknown scenario.{" "}
        <Link href="/" className="text-accent underline">
          Back to scenarios
        </Link>
      </p>
    );
  }

  const start = async () => {
    if (!session) return;
    sessionRef.current = session;
    setEntries([]);
    setFeedback(null);
    setFeedbackState("idle");
    startedAtRef.current = Date.now();
    const reviewVocab = listVocab()
      .slice(0, 8)
      .map((v) => v.tagalog);
    const learner = loadLearnerState();
    const errorFocus = topErrorTags(learner, 3).map((e) => ({
      patternTag: e.patternTag,
      example: e.examples[0]?.learnerSaid,
    }));
    const reviewItems =
      mode === "review" ? dueItems(learner.vocabSrs, Date.now(), 12) : undefined;
    reviewItemsRef.current = reviewItems;
    try {
      await session.connect({
        scenarioId: scenario.id,
        taglishLevel,
        voice: voice ?? scenario.voice,
        reviewVocab,
        mode,
        currentUnit: learner.currentUnit,
        errorFocus,
        reviewItems,
        seedId: seedHit?.seed.id,
      });
      if (seedHit) saveLearnerState({ ...learner, lastSeedId: seedHit.seed.id });
    } catch (err) {
      setStatus("error");
      setStatusDetail(err instanceof Error ? err.message : "Could not start the session.");
      session.disconnect();
    }
  };

  const hangUp = async () => {
    session?.disconnect();
    setStatus("ended");

    const transcript = entriesRef.current.filter((e) => e.text.trim());
    const record: SessionRecord = {
      id: `s-${startedAtRef.current}`,
      scenarioId: scenario.id,
      taglishLevel,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      transcript,
      feedback: null,
      mode,
      unitId: loadLearnerState().currentUnit,
    };

    const spoke = transcript.some((e) => e.speaker === "you");
    if (!spoke) {
      saveSession(record);
      setSavedSessionId(record.id);
      setFeedbackState("skipped");
      return;
    }

    setFeedbackState("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          mode,
          currentUnit: loadLearnerState().currentUnit,
          reviewItems: reviewItemsRef.current,
        }),
      });
      if (!res.ok) throw new Error();
      const { feedback: fb } = (await res.json()) as { feedback: Feedback };
      record.feedback = fb;
      setFeedback(fb);
      setFeedbackState("done");
      addVocab(
        fb.vocab.map((v) => ({ ...v, scenarioId: scenario.id, addedAt: Date.now() }))
      );
      let learner = loadLearnerState();
      const now = Date.now();
      learner = recordCorrections(
        learner,
        fb.corrections.map((c) => ({ learnerSaid: c.youSaid, target: c.better, patternTag: c.patternTag })),
        learner.currentUnit,
        now
      );
      if (fb.reviewResults) learner = applyReviewResults(learner, fb.reviewResults, now);
      learner = logSession(learner, {
        ts: startedAtRef.current,
        mode,
        unitId: learner.currentUnit,
        corrections: fb.corrections.length,
        durationMin: Math.max(1, Math.round((now - startedAtRef.current) / 60000)),
        drillScores: fb.drillScores
          ? Object.fromEntries(fb.drillScores.map((d) => [d.targetId, d.score]))
          : undefined,
      });
      saveLearnerState(learner);
    } catch {
      setFeedbackState("error");
    }
    saveSession(record);
    setSavedSessionId(record.id);
  };

  const toggleMute = () => {
    session?.setMuted(!muted);
    setMuted(!muted);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {scenario.emoji} {scenario.title}
          </h1>
          <p className="text-sm opacity-70">
            {scenario.description} · {TAGLISH_LABELS[taglishLevel]}
            {mode !== "free" && <> · {mode === "target" ? "Target scene" : "Review sprint"}</>}
          </p>
        </div>
        <Link href="/" className="text-sm text-accent underline">
          Change scene
        </Link>
      </div>

      {status === "idle" && (
        <div className="rounded-xl border border-black/10 p-6 text-center dark:border-white/10">
          <p className="mb-4 text-sm opacity-70">
            You&apos;ll need your microphone. Your kausap speaks first — just respond naturally,
            and hit the lifeline any time you&apos;re stuck.
          </p>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            {(["target", "free", "review"] as const).map((m) => (
              <Link
                key={m}
                href={`/practice/${scenarioId}?level=${taglishLevel}&mode=${m}${seedId ? `&seed=${seedId}` : ""}`}
                className={`rounded-full border px-3 py-1 ${
                  mode === m
                    ? "border-(--accent) bg-(--accent) text-white"
                    : "border-black/20 dark:border-white/20"
                }`}
              >
                {m === "target" ? "🎬 Target scene" : m === "free" ? "🗣️ Free scene" : "⚡ Review sprint"}
              </Link>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            <label htmlFor="voice" className="opacity-70">
              Voice
            </label>
            <select
              id="voice"
              value={voice ?? scenario.voice}
              onChange={(e) => setVoice(e.target.value)}
              className="rounded-lg border border-black/20 bg-transparent px-2 py-1 dark:border-white/20"
            >
              {VOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                  {v === scenario.voice ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={start}
            className="rounded-full bg-(--accent) px-6 py-3 font-medium text-white hover:opacity-90"
          >
            🎙️ Start conversation
          </button>
        </div>
      )}

      {status === "connecting" && (
        <div className="rounded-xl border border-black/10 p-6 text-center dark:border-white/10">
          <p className="animate-pulse">{statusDetail || "Connecting…"}</p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm">
          <p className="font-medium text-red-600 dark:text-red-400">Something went wrong</p>
          <p className="mt-1 opacity-80">{statusDetail}</p>
          <button onClick={start} className="mt-3 rounded-full border border-current px-4 py-1.5 text-sm">
            Try again
          </button>
        </div>
      )}

      {(status === "live" || status === "ended" || entries.length > 0) && (
        <div className="flex max-h-[50vh] min-h-40 flex-col gap-2 overflow-y-auto rounded-xl border border-black/10 p-4 dark:border-white/10">
          {entries.length === 0 && (
            <p className="text-sm italic opacity-50">Waiting for your kausap to speak…</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className={e.speaker === "you" ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  e.speaker === "you"
                    ? "bg-(--accent) text-white"
                    : "bg-black/5 dark:bg-white/10"
                } ${e.final ? "" : "opacity-70"}`}
              >
                {e.text}
              </span>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}

      {status === "live" && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => session?.lifeline()}
            className="rounded-full bg-(--accent-warm) px-5 py-3 font-medium text-white hover:opacity-90"
            title="Stuck? Get the phrase you need."
          >
            🛟 Lifeline
          </button>
          <button
            onClick={toggleMute}
            className="rounded-full border border-black/20 px-5 py-3 dark:border-white/20"
          >
            {muted ? "🔇 Unmute" : "🎙️ Mute"}
          </button>
          <button
            onClick={hangUp}
            className="rounded-full bg-red-600 px-5 py-3 font-medium text-white hover:opacity-90"
          >
            📞 Hang up
          </button>
        </div>
      )}

      {status === "ended" && (
        <div className="flex flex-col gap-4">
          {feedbackState === "loading" && (
            <p className="animate-pulse text-center text-sm opacity-70">
              Salamat! Reviewing your conversation…
            </p>
          )}
          {feedbackState === "skipped" && (
            <p className="text-center text-sm opacity-70">
              No speech captured this time — walang problema. Try again when you&apos;re ready.
            </p>
          )}
          {feedbackState === "error" && (
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              Couldn&apos;t generate feedback, but your transcript is saved
              {savedSessionId && (
                <>
                  {" "}
                  in <Link href={`/sessions/${savedSessionId}`} className="underline">your sessions</Link>
                </>
              )}
              .
            </p>
          )}
          {feedbackState === "done" && feedback && <FeedbackReport feedback={feedback} />}
          <div className="flex justify-center gap-3">
            <button
              onClick={start}
              className="rounded-full bg-(--accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Ulitin — practice again
            </button>
            <Link
              href="/"
              className="rounded-full border border-black/20 px-5 py-2.5 text-sm dark:border-white/20"
            >
              Another scene
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
