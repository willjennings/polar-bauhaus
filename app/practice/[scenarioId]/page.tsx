"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getScenario, TAGLISH_LABELS } from "@/lib/scenarios";
import { RealtimeSession, type SessionStatus } from "@/lib/realtime";
import { addVocab, saveSession } from "@/lib/store";
import type { Feedback, SessionRecord, TranscriptEntry } from "@/lib/types";
import FeedbackReport from "@/app/components/FeedbackReport";

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
  const scenario = getScenario(scenarioId);
  const taglishLevel = Math.min(5, Math.max(1, Number(searchParams.get("level")) || 3));

  const [status, setStatus] = useState<SessionStatus>("idle");
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
    try {
      await session.connect(scenario.id, taglishLevel);
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
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error();
      const { feedback: fb } = (await res.json()) as { feedback: Feedback };
      record.feedback = fb;
      setFeedback(fb);
      setFeedbackState("done");
      addVocab(
        fb.vocab.map((v) => ({ ...v, scenarioId: scenario.id, addedAt: Date.now() }))
      );
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
