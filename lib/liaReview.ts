/**
 * D-instrumentation: a weekly native-speaker register-review checklist for
 * Lia (~10 minutes), built purely from local data. UI wiring lands in
 * Tier 2B; this module only produces the markdown.
 */
import type { SessionRecord, VocabItem } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildLiaReviewMarkdown(opts: {
  sessions: SessionRecord[];
  vocab: VocabItem[];
  now: number;
  days?: number;
}): string {
  const days = opts.days ?? 7;
  const cutoff = opts.now - days * DAY_MS;

  const newVocab = opts.vocab
    .filter((v) => v.addedAt >= cutoff)
    .sort((a, b) => b.addedAt - a.addedAt);

  // Keeps the first occurrence per `better` and drops the rest. This module
  // never sorts `opts.sessions` itself, so which occurrence "wins" is
  // entirely up to caller order — real callers (e.g. app/lia-prep/page.tsx,
  // via lib/store.ts's listSessions()) pass sessions newest-first, so in
  // practice this keeps the MOST RECENT correction for a given `better`,
  // not the oldest.
  const seenBetter = new Set<string>();
  const corrections: { youSaid: string; better: string; note: string }[] = [];
  for (const s of opts.sessions) {
    if (s.startedAt < cutoff) continue;
    for (const c of s.feedback?.corrections ?? []) {
      if (seenBetter.has(c.better)) continue;
      seenBetter.add(c.better);
      corrections.push(c);
    }
  }

  const sections: string[] = [
    `# For Lia: weekly register check (about 10 minutes)`,
    ``,
    `Check what the AI taught Will this week — mark anything your family wouldn't actually say.`,
  ];

  if (newVocab.length > 0) {
    sections.push(
      ``,
      `## New vocab this week`,
      ...newVocab.map((v) => `- [ ] **${v.tagalog}** — ${v.english} ("${v.example}")`)
    );
  }

  if (corrections.length > 0) {
    sections.push(
      ``,
      `## Corrections taught this week`,
      ...corrections.map((c) => `- [ ] "${c.youSaid}" → **"${c.better}"** (${c.note})`)
    );
  }

  sections.push(``, `Write the family's version next to anything you check.`);

  return sections.join("\n");
}
