import { describe, it, expect } from "vitest";
import { buildLiaReviewMarkdown } from "@/lib/liaReview";
import type { SessionRecord, VocabItem } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

function vocab(overrides: Partial<VocabItem> & { tagalog: string; addedAt: number }): VocabItem {
  return {
    english: "english",
    example: "example sentence",
    scenarioId: "s1",
    ...overrides,
  };
}

function session(overrides: Partial<SessionRecord> & { id: string; startedAt: number }): SessionRecord {
  return {
    scenarioId: "s1",
    taglishLevel: 3,
    endedAt: overrides.startedAt + 1000,
    transcript: [],
    feedback: null,
    ...overrides,
  };
}

describe("buildLiaReviewMarkdown", () => {
  it("includes an explanatory header for Lia", () => {
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: [], now: NOW });
    expect(md.toLowerCase()).toContain("check what the ai taught will this week");
    expect(md.toLowerCase()).toContain("mark anything your family wouldn't actually say");
  });

  it("lists new vocab from the last `days` window, formatted with tagalog/english/example", () => {
    const items = [
      vocab({ tagalog: "salamat", english: "thank you", example: "Salamat po.", addedAt: NOW - 1 * DAY }),
    ];
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: items, now: NOW });
    expect(md).toContain('- [ ] **salamat** — thank you ("Salamat po.")');
  });

  it("excludes vocab added before the window", () => {
    const items = [vocab({ tagalog: "luma", addedAt: NOW - 30 * DAY })];
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: items, now: NOW });
    expect(md).not.toContain("luma");
  });

  it("respects a custom `days` window", () => {
    const items = [vocab({ tagalog: "bago", addedAt: NOW - 10 * DAY })];
    const withDefault = buildLiaReviewMarkdown({ sessions: [], vocab: items, now: NOW });
    const withWider = buildLiaReviewMarkdown({ sessions: [], vocab: items, now: NOW, days: 14 });
    expect(withDefault).not.toContain("bago");
    expect(withWider).toContain("bago");
  });

  it("lists corrections taught in the window from sessions filtered by startedAt", () => {
    const sessions = [
      session({
        id: "s1",
        startedAt: NOW - 2 * DAY,
        feedback: {
          summary: "s",
          corrections: [{ youSaid: "ako ay kain", better: "kumain ako", note: "aspect" }],
          vocab: [],
          encouragement: "e",
        },
      }),
    ];
    const md = buildLiaReviewMarkdown({ sessions, vocab: [], now: NOW });
    expect(md).toContain('- [ ] "ako ay kain" → **"kumain ako"** (aspect)');
  });

  it("excludes corrections from sessions outside the window", () => {
    const sessions = [
      session({
        id: "s1",
        startedAt: NOW - 30 * DAY,
        feedback: {
          summary: "s",
          corrections: [{ youSaid: "x", better: "y", note: "n" }],
          vocab: [],
          encouragement: "e",
        },
      }),
    ];
    const md = buildLiaReviewMarkdown({ sessions, vocab: [], now: NOW });
    expect(md).not.toContain('"x"');
  });

  it("dedupes corrections by `better`, keeping the most recent occurrence (real callers pass sessions newest-first)", () => {
    const sessions = [
      // Newest first, matching lib/store.ts's listSessions() ordering that
      // real callers (app/lia-prep/page.tsx) actually pass in.
      session({
        id: "s2",
        startedAt: NOW - 1 * DAY,
        feedback: {
          summary: "s",
          corrections: [{ youSaid: "a2", better: "kumain ako", note: "n2" }],
          vocab: [],
          encouragement: "e",
        },
      }),
      session({
        id: "s1",
        startedAt: NOW - 3 * DAY,
        feedback: {
          summary: "s",
          corrections: [{ youSaid: "a1", better: "kumain ako", note: "n1" }],
          vocab: [],
          encouragement: "e",
        },
      }),
    ];
    const md = buildLiaReviewMarkdown({ sessions, vocab: [], now: NOW });
    const occurrences = md.split("kumain ako").length - 1;
    expect(occurrences).toBe(1);
    expect(md).toContain('"a2"');
    expect(md).not.toContain('"a1"');
  });

  it("ignores sessions with null feedback", () => {
    const sessions = [session({ id: "s1", startedAt: NOW - 1 * DAY, feedback: null })];
    const md = buildLiaReviewMarkdown({ sessions, vocab: [], now: NOW });
    expect(md).not.toContain("## Corrections");
  });

  it("skips the vocab section entirely when there is no new vocab", () => {
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: [], now: NOW });
    expect(md.toLowerCase()).not.toContain("## new vocab");
  });

  it("skips the corrections section entirely when there are no corrections", () => {
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: [], now: NOW });
    expect(md.toLowerCase()).not.toContain("## correction");
  });

  it("closes with a line inviting Lia to write the family's version", () => {
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: [], now: NOW });
    expect(md.toLowerCase()).toContain("write the family's version");
  });

  it("produces a sane, non-empty output for fully empty input, with no section headers", () => {
    const md = buildLiaReviewMarkdown({ sessions: [], vocab: [], now: NOW });
    expect(md.length).toBeGreaterThan(0);
    expect(md.toLowerCase()).not.toContain("## new vocab");
    expect(md.toLowerCase()).not.toContain("## correction");
    expect(md.toLowerCase()).toContain("write the family's version");
  });
});
