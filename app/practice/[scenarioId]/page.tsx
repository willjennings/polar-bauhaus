"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getScenario, TAGLISH_LABELS, VOICES } from "@/lib/scenarios";
import { RealtimeSession, type SessionStatus } from "@/lib/realtime";
import { addVocab, getSession, listSessions, listVocab, saveSession } from "@/lib/store";
import type { Correction, Feedback, SessionRecord, TranscriptEntry } from "@/lib/types";
import FeedbackReport from "@/app/components/FeedbackReport";
import { getSeed, seedToScenario } from "@/lib/curriculum";
import {
  loadLearnerState, saveLearnerState, recordCorrections, logSession,
  applyReviewResults, recentErrorFocus, dismissCorrection, foldVocabIntoSrs, type Mode,
} from "@/lib/learner";
import { dueItems } from "@/lib/srs";
import { useHydrated } from "@/lib/useHydrated";

const SESSION_DRAFT_KEY = "kausap.sessionDraft";

interface SessionDraft {
  startedAt: number;
  scenarioId: string;
  unitId: string;
  /** The mode the learner picked (target/free/review) before any downgrade. */
  mode: Mode;
  /** The review→free downgrade applied when a review sprint has no due items (F8b) — this is what actually gets saved. */
  effectiveMode: Mode;
  taglishLevel: number;
  entries: TranscriptEntry[];
  reviewItems?: string[];
}

function loadSessionDraft(): SessionDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionDraft;
  } catch {
    return null;
  }
}

function writeSessionDraft(draft: SessionDraft) {
  try {
    window.localStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Best-effort — a full/blocked localStorage shouldn't interrupt the live session.
  }
}

function clearSessionDraft() {
  try {
    window.localStorage.removeItem(SESSION_DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Same merge rule the transcript state uses: replace on final, append text on delta. */
function mergeTranscriptEntry(prev: TranscriptEntry[], entry: TranscriptEntry): TranscriptEntry[] {
  const i = prev.findIndex((e) => e.id === entry.id);
  if (i === -1) return [...prev, entry];
  const next = [...prev];
  next[i] = entry.final ? entry : { ...next[i], text: next[i].text + entry.text };
  return next;
}

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
  // Bumped after Save/Discard on the recovered-draft banner so it re-reads localStorage.
  const [, setDraftVersion] = useState(0);
  const hydrated = useHydrated();
  const hasDue = hydrated && dueItems(loadLearnerState().vocabSrs, Date.now(), 1).length > 0;

  const sessionRef = useRef<RealtimeSession | null>(null);
  const entriesRef = useRef<TranscriptEntry[]>([]);
  const startedAtRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const reviewItemsRef = useRef<string[] | undefined>(undefined);
  const sessionMetaRef = useRef<{
    scenarioId: string;
    unitId: string;
    mode: Mode;
    effectiveMode: Mode;
    taglishLevel: number;
  } | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    entriesRef.current = entries;
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    return () => {
      sessionRef.current?.disconnect();
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // The wake lock is auto-released by the browser whenever the tab is
  // backgrounded, so a learner switching apps mid-session and coming back
  // would otherwise lose it silently. Re-request it on visibilitychange
  // while the session is live; listener is added/removed with the live
  // status so it never fires after disconnect/unmount.
  useEffect(() => {
    if (status !== "live") return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        ?.request("screen")
        .then((sentinel) => {
          wakeLockRef.current = sentinel;
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [status]);

  const session = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new RealtimeSession({
      onStatus: (s, detail) => {
        setStatus(s);
        setStatusDetail(detail ?? "");
      },
      onTranscript: (entry) => {
        setEntries((prev) => mergeTranscriptEntry(prev, entry));
        if (entry.final) {
          const meta = sessionMetaRef.current;
          if (meta) {
            const nextEntries = mergeTranscriptEntry(entriesRef.current, entry);
            entriesRef.current = nextEntries;
            writeSessionDraft({
              startedAt: startedAtRef.current,
              scenarioId: meta.scenarioId,
              unitId: meta.unitId,
              mode: meta.mode,
              effectiveMode: meta.effectiveMode,
              taglishLevel: meta.taglishLevel,
              entries: nextEntries,
              reviewItems: reviewItemsRef.current,
            });
          }
        }
      },
    });
  }, []);

  // Recovery banner for an interrupted session (crash/refresh before hangUp saved it).
  const sessionDraft = hydrated ? loadSessionDraft() : null;
  const draftHasSpeech = !!sessionDraft?.entries.some((e) => e.speaker === "you" && e.final);
  const draftAlreadySaved = sessionDraft
    ? listSessions().some((s) => s.startedAt === sessionDraft.startedAt)
    : false;
  const showDraftBanner = hydrated && !!sessionDraft && draftHasSpeech && !draftAlreadySaved;

  const saveDraftSession = () => {
    if (!sessionDraft) return;
    const now = Date.now();
    // Older drafts written before the effectiveMode field existed fall back to mode.
    const effectiveMode = sessionDraft.effectiveMode ?? sessionDraft.mode;
    const record: SessionRecord = {
      id: `s-${sessionDraft.startedAt}`,
      scenarioId: sessionDraft.scenarioId,
      taglishLevel: sessionDraft.taglishLevel,
      startedAt: sessionDraft.startedAt,
      endedAt: now,
      transcript: sessionDraft.entries.filter((e) => e.text.trim()),
      feedback: null,
      mode: effectiveMode,
      unitId: sessionDraft.unitId,
    };
    if (effectiveMode === "review" && sessionDraft.reviewItems) {
      record.reviewItems = sessionDraft.reviewItems;
    }
    saveSession(record);
    try {
      let learner = loadLearnerState();
      learner = logSession(learner, {
        ts: sessionDraft.startedAt,
        mode: effectiveMode,
        unitId: sessionDraft.unitId,
        corrections: 0,
        durationMin: Math.max(1, Math.round((now - sessionDraft.startedAt) / 60000)),
      });
      saveLearnerState(learner);
    } catch (err) {
      console.error("learner state update failed:", err);
    }
    clearSessionDraft();
    setDraftVersion((v) => v + 1);
  };

  const discardDraftSession = () => {
    clearSessionDraft();
    setDraftVersion((v) => v + 1);
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
    setFeedback((prev) => (prev ? { ...prev, corrections: prev.corrections.filter((x) => !isSame(x)) } : prev));
    if (savedSessionId) {
      const rec = getSession(savedSessionId);
      if (rec?.feedback) {
        saveSession({
          ...rec,
          feedback: { ...rec.feedback, corrections: rec.feedback.corrections.filter((x) => !isSame(x)) },
        });
      }
    }
  };

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
    // A seed replays that scene's own unit, even if the learner has since
    // advanced past it — otherwise an old-unit seed gets scored/logged
    // against whatever unit the learner is currently on (F3).
    const sessionUnitId = seedHit ? seedHit.unit.id : learner.currentUnit;
    const errorFocus = recentErrorFocus(learner, Date.now(), 3).map((e) => ({
      patternTag: e.patternTag,
      example: e.examples[0]?.learnerSaid,
    }));
    const reviewItems =
      mode === "review" ? dueItems(learner.vocabSrs, Date.now(), 12) : undefined;
    reviewItemsRef.current = reviewItems;
    // A "review sprint" with no actual due items to review isn't a real
    // review session — log/score it as free instead (F8b). Computed once
    // here (right where reviewItemsRef is set) so every session-draft
    // snapshot written during the session already reflects the mode hangUp
    // will ultimately save.
    const effectiveMode: Mode = mode === "review" && !(reviewItems?.length) ? "free" : mode;
    sessionMetaRef.current = {
      scenarioId: scenario.id,
      unitId: sessionUnitId,
      mode,
      effectiveMode,
      taglishLevel,
    };
    try {
      await session.connect({
        scenarioId: scenario.id,
        taglishLevel,
        voice: voice ?? scenario.voice,
        reviewVocab,
        mode,
        currentUnit: sessionUnitId,
        errorFocus,
        reviewItems,
        seedId: seedHit?.seed.id,
      });
      // Reload fresh state right before saving: the connect() await may have
      // let another save (e.g. from hangUp of a prior session) land in
      // between, and saving the stale pre-await snapshot would clobber it (F4).
      if (seedHit) saveLearnerState({ ...loadLearnerState(), lastSeedId: seedHit.seed.id });
      try {
        wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        wakeLockRef.current = null;
      }
    } catch (err) {
      setStatus("error");
      setStatusDetail(err instanceof Error ? err.message : "Could not start the session.");
      session.disconnect();
    }
  };

  const hangUp = async () => {
    session?.disconnect();
    setStatus("ended");
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;

    const sessionUnitId = seedHit ? seedHit.unit.id : loadLearnerState().currentUnit;
    // A "review sprint" with no actual due items to review (e.g. started
    // before hydration settled, or the queue emptied mid-session) isn't a
    // real review session — log/score it as free instead (F8b). Sourced from
    // the same ref the session-draft snapshots use, so the two never drift.
    const effectiveMode: Mode =
      sessionMetaRef.current?.effectiveMode ??
      (mode === "review" && !(reviewItemsRef.current?.length) ? "free" : mode);

    const transcript = entriesRef.current.filter((e) => e.text.trim());
    const record: SessionRecord = {
      id: `s-${startedAtRef.current}`,
      scenarioId: scenario.id,
      taglishLevel,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      transcript,
      feedback: null,
      mode: effectiveMode,
      unitId: sessionUnitId,
    };

    const spoke = transcript.some((e) => e.speaker === "you");
    if (!spoke) {
      saveSession(record);
      setSavedSessionId(record.id);
      setFeedbackState("skipped");
      clearSessionDraft();
      return;
    }

    setFeedbackState("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          mode: effectiveMode,
          currentUnit: sessionUnitId,
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
      // A failure folding this report into learner state (e.g. localStorage
      // full/blocked) shouldn't flip an otherwise-successful report to an
      // error screen — the feedback itself already rendered fine (F5).
      try {
        let learner = loadLearnerState();
        const now = Date.now();
        learner = recordCorrections(
          learner,
          fb.corrections.map((c) => ({ learnerSaid: c.youSaid, target: c.better, patternTag: c.patternTag })),
          sessionUnitId,
          now
        );
        if (fb.reviewResults) learner = applyReviewResults(learner, fb.reviewResults, now);
        learner = foldVocabIntoSrs(learner, fb.vocab.map((v) => v.tagalog), now);
        learner = logSession(learner, {
          ts: startedAtRef.current,
          mode: effectiveMode,
          unitId: sessionUnitId,
          corrections: fb.corrections.length,
          durationMin: Math.max(1, Math.round((now - startedAtRef.current) / 60000)),
          drillScores: fb.drillScores
            ? Object.fromEntries(fb.drillScores.map((d) => [d.targetId, d.score]))
            : undefined,
        });
        saveLearnerState(learner);
      } catch (err) {
        console.error("learner state update failed:", err);
      }
    } catch {
      setFeedbackState("error");
      // Feedback generation failed, but the learner still gets credit for the
      // session so streaks/logs aren't lost — retryable later from /sessions.
      try {
        let learner = loadLearnerState();
        const now = Date.now();
        learner = logSession(learner, {
          ts: startedAtRef.current,
          mode: effectiveMode,
          unitId: sessionUnitId,
          corrections: 0,
          durationMin: Math.max(1, Math.round((now - startedAtRef.current) / 60000)),
        });
        saveLearnerState(learner);
      } catch (err) {
        console.error("learner state update failed:", err);
      }
    }
    if (effectiveMode === "review") record.reviewItems = reviewItemsRef.current;
    saveSession(record);
    setSavedSessionId(record.id);
    clearSessionDraft();
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
          {showDraftBanner && sessionDraft && (
            <div className="mb-4 rounded-lg border border-(--accent) bg-(--accent)/5 p-3 text-sm">
              <p>
                You have an unfinished session from {new Date(sessionDraft.startedAt).toLocaleString()}.
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={saveDraftSession}
                  className="rounded-full bg-(--accent) px-3 py-1 text-white"
                >
                  Save it
                </button>
                <button
                  onClick={discardDraftSession}
                  className="rounded-full border border-black/20 px-3 py-1 dark:border-white/20"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          <p className="mb-4 text-sm opacity-70">
            You&apos;ll need your microphone. Your kausap speaks first — just respond naturally,
            and hit the lifeline any time you&apos;re stuck.
          </p>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            {(["target", "free", "review"] as const)
              .filter((m) => m !== "review" || hasDue)
              .map((m) => (
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
          <div className="mt-3 flex gap-2">
            <button onClick={start} className="rounded-full border border-current px-4 py-1.5 text-sm">
              Try again
            </button>
            {entries.some((e) => e.speaker === "you" && e.final) && (
              <button onClick={hangUp} className="rounded-full border border-current px-4 py-1.5 text-sm">
                🏁 End &amp; get feedback
              </button>
            )}
          </div>
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
          {feedbackState === "done" && feedback && (
            <FeedbackReport feedback={feedback} onDismiss={handleDismiss} />
          )}
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
