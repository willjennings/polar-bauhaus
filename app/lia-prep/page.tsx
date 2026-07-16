"use client";

import { useState } from "react";
import Link from "next/link";
import { getUnit } from "@/lib/curriculum";
import { loadLearnerState } from "@/lib/learner";
import { useHydrated } from "@/lib/useHydrated";
import { listSessions, listVocab } from "@/lib/store";
import { buildLiaReviewMarkdown } from "@/lib/liaReview";

interface Prompt { tagalog: string; english: string }

export default function LiaPrepPage() {
  const hydrated = useHydrated();
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const unit = hydrated ? getUnit(loadLearnerState().currentUnit) : undefined;
  const reviewMarkdown = hydrated
    ? buildLiaReviewMarkdown({ sessions: listSessions(), vocab: listVocab(), now: Date.now() })
    : "";

  const generate = async () => {
    setState("loading");
    setPrompts(null);
    try {
      const res = await fetch("/api/lia-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUnit: loadLearnerState().currentUnit }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { prompts: Prompt[] };
      setPrompts(data.prompts);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const copy = async () => {
    if (!prompts) return;
    try {
      await navigator.clipboard.writeText(
        prompts.map((p) => `• ${p.tagalog}\n  (${p.english})`).join("\n")
      );
    } catch {
      window.alert("Copy failed — select and copy manually.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReview = async () => {
    try {
      await navigator.clipboard.writeText(reviewMarkdown);
    } catch {
      window.alert("Copy failed — select and copy manually.");
      return;
    }
    setReviewCopied(true);
    setTimeout(() => setReviewCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">🍽️ Lia Prep</h1>
        <p className="mt-1 text-sm opacity-70">
          Dinner-table conversation starters from your current unit
          {unit ? ` (${unit.id} — ${unit.title})` : ""}. Use them tonight.
        </p>
      </div>

      <button
        onClick={generate}
        disabled={state === "loading" || !unit}
        className="self-start rounded-full bg-(--accent) px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {state === "loading" ? "Thinking…" : prompts ? "Regenerate" : "Generate prompts"}
      </button>

      {state === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">Could not generate — try again.</p>
      )}

      {prompts && (
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ul className="space-y-3">
            {prompts.map((p) => (
              <li key={p.tagalog}>
                <p className="font-medium">{p.tagalog}</p>
                <p className="text-sm opacity-60">{p.english}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={copy}
            className="mt-4 rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            {copied ? "✓ Copied" : "📋 Copy card"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">📋 Weekly register review (for Lia)</h2>
        <p className="mt-1 text-sm opacity-70">
          Ten minutes: she checks what the AI taught this week against how the family actually talks.
        </p>
        <button
          onClick={copyReview}
          disabled={!hydrated}
          className="mt-3 rounded-full bg-(--accent) px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {reviewCopied ? "✓ Copied" : "Copy this week's review"}
        </button>
        {hydrated && (
          <pre className="mt-3 whitespace-pre-wrap text-xs opacity-60">
            {reviewMarkdown.split("\n").slice(0, 6).join("\n")}
          </pre>
        )}
      </div>

      <Link href="/curriculum" className="text-sm text-accent underline">
        ← Back to curriculum
      </Link>
    </div>
  );
}
