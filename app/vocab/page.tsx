"use client";

import { useState } from "react";
import Link from "next/link";
import { exportVocabJson, listVocab, removeVocab } from "@/lib/store";
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
              <span className="font-medium">{v.tagalog}</span>
              <span className="opacity-70"> — {v.english}</span>
              <span className="block text-sm italic opacity-60">{v.example}</span>
              <span className="mt-1 block text-xs opacity-50">
                from {getScenario(v.scenarioId)?.title ?? v.scenarioId}
              </span>
            </div>
            <button
              onClick={() => remove(v.tagalog)}
              className="text-xs opacity-50 hover:opacity-100"
              aria-label={`Remove ${v.tagalog}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
