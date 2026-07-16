"use client";

import { useState } from "react";
import Link from "next/link";
import { exportVocabJson, listVocab, removeVocab, updateVocab } from "@/lib/store";
import { getScenario } from "@/lib/scenarios";
import { useHydrated } from "@/lib/useHydrated";

export default function VocabPage() {
  const hydrated = useHydrated();
  // Bumped after every mutation so the list re-reads from localStorage.
  const [, setVersion] = useState(0);

  if (!hydrated) return null;
  const vocab = listVocab();

  const download = () => {
    const blob = new Blob([exportVocabJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kausap-vocab.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = (tagalog: string) => {
    removeVocab(tagalog);
    setVersion((v) => v + 1);
  };

  const toggleVerified = (v: (typeof vocab)[number]) => {
    updateVocab(v.tagalog, { familyVerified: v.familyVerified === true ? undefined : true });
    setVersion((n) => n + 1);
  };

  const toggleReplaced = (v: (typeof vocab)[number]) => {
    updateVocab(v.tagalog, { familyVerified: v.familyVerified === "replaced" ? undefined : "replaced" });
    setVersion((n) => n + 1);
  };

  if (vocab.length === 0) {
    return (
      <div className="text-center">
        <p className="opacity-70">
          No vocab yet — words your kausap teaches you will collect here.
        </p>
        <Link href="/" className="mt-2 inline-block text-accent underline">
          Go practice
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your vocab ({vocab.length})</h1>
        <button
          onClick={download}
          className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
        >
          Export JSON
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {vocab.map((v) => (
          <li
            key={v.tagalog}
            className="flex items-start justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
          >
            <div>
              <span className={`font-medium ${v.familyVerified === "replaced" ? "line-through opacity-60" : ""}`}>
                {v.tagalog}
              </span>
              {v.familyVerified === true && (
                <span className="ml-1 text-green-600 dark:text-green-400" title="Family-verified">
                  ✓
                </span>
              )}
              <span className={`opacity-70 ${v.familyVerified === "replaced" ? "line-through" : ""}`}>
                {" "}
                — {v.english}
              </span>
              <span
                className={`block text-sm italic opacity-60 ${
                  v.familyVerified === "replaced" ? "line-through" : ""
                }`}
              >
                {v.example}
              </span>
              <span className="mt-1 block text-xs opacity-50">
                from {getScenario(v.scenarioId)?.title ?? v.scenarioId}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleVerified(v)}
                title="Family-verified — Lia says yes"
                aria-label={`Mark ${v.tagalog} as family-verified`}
                className={`rounded-full border px-1.5 py-0.5 text-xs ${
                  v.familyVerified === true
                    ? "border-green-600 bg-green-600/10 text-green-600 dark:border-green-400 dark:text-green-400"
                    : "border-black/20 opacity-50 hover:opacity-100 dark:border-white/20"
                }`}
              >
                ✓
              </button>
              <button
                onClick={() => toggleReplaced(v)}
                title="Family says no — replaced"
                aria-label={`Mark ${v.tagalog} as replaced by the family`}
                className={`rounded-full border px-1.5 py-0.5 text-xs ${
                  v.familyVerified === "replaced"
                    ? "border-red-600 bg-red-600/10 text-red-600 dark:border-red-400 dark:text-red-400"
                    : "border-black/20 opacity-50 hover:opacity-100 dark:border-white/20"
                }`}
              >
                ✗
              </button>
              <button
                onClick={() => remove(v.tagalog)}
                className="text-xs opacity-50 hover:opacity-100"
                aria-label={`Remove ${v.tagalog}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
