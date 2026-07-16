import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildBackup, serializeBackup, restoreBackup, mergeLearnerStates, type BackupFile } from "@/lib/backup";
import { saveSession, addVocab, listSessions, listVocab } from "@/lib/store";
import { defaultLearnerState, loadLearnerState, saveLearnerState } from "@/lib/learner";
import type { SessionRecord, VocabItem } from "@/lib/types";

const T = 1_700_000_000_000;

function makeLocalStorageStub() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => {
      map.clear();
    },
  };
}

function freshWindow() {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: makeLocalStorageStub(),
  };
}

describe("backup", () => {
  beforeEach(() => {
    freshWindow();
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("round-trips full state through build/serialize/restore into empty stores", () => {
    const session: SessionRecord = {
      id: "s1",
      scenarioId: "cooking",
      taglishLevel: 3,
      startedAt: 1000,
      endedAt: 2000,
      transcript: [],
      feedback: null,
    };
    saveSession(session);

    const vocab: VocabItem = {
      tagalog: "kumusta",
      english: "how are you",
      example: "Kumusta ka?",
      scenarioId: "cooking",
      addedAt: 500,
    };
    addVocab([vocab]);

    const learner = { ...defaultLearnerState(), currentUnit: "u04" };
    saveLearnerState(learner);

    const backup = buildBackup(9999);
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBe(9999);
    const json = serializeBackup(backup);

    // Restore into brand-new, empty stores.
    freshWindow();
    const result = restoreBackup(json, 10000);
    expect(result.ok).toBe(true);

    expect(listSessions().map((s) => s.id)).toEqual(["s1"]);
    expect(listVocab().map((v) => v.tagalog)).toEqual(["kumusta"]);
    expect(loadLearnerState().currentUnit).toBe("u04");
  });

  it("rejects invalid JSON", () => {
    const result = restoreBackup("not json", 0);
    expect(result.ok).toBe(false);
  });

  it("rejects wrong version or missing fields", () => {
    expect(restoreBackup(JSON.stringify({ version: 2, sessions: [], vocab: [], learner: defaultLearnerState() }), 0).ok).toBe(false);
    expect(restoreBackup(JSON.stringify({ version: 1, sessions: [], vocab: [] }), 0).ok).toBe(false);
    expect(restoreBackup(JSON.stringify({ version: 1, sessions: "nope", vocab: [], learner: defaultLearnerState() }), 0).ok).toBe(false);
  });

  it("re-keys colliding session ids that have differing startedAt", () => {
    saveSession({
      id: "s1",
      scenarioId: "a",
      taglishLevel: 1,
      startedAt: 1,
      endedAt: 2,
      transcript: [],
      feedback: null,
    });
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [
        {
          id: "s1",
          scenarioId: "b",
          taglishLevel: 1,
          startedAt: 999,
          endedAt: 1000,
          transcript: [],
          feedback: null,
        },
      ],
      vocab: [],
      learner: defaultLearnerState(),
    };
    const result = restoreBackup(serializeBackup(backup), 0);
    expect(result.ok).toBe(true);
    const ids = listSessions().map((s) => s.id);
    expect(ids).toContain("s1");
    expect(ids).toContain("s1-imported-999");
  });

  it("does not duplicate a session with the same id and startedAt", () => {
    const session: SessionRecord = {
      id: "s1",
      scenarioId: "a",
      taglishLevel: 1,
      startedAt: 1,
      endedAt: 2,
      transcript: [],
      feedback: null,
    };
    saveSession(session);
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [session],
      vocab: [],
      learner: defaultLearnerState(),
    };
    const result = restoreBackup(serializeBackup(backup), 0);
    expect(result.ok).toBe(true);
    expect(listSessions()).toHaveLength(1);
  });

  it("on id+startedAt collision, prefers the record with non-null feedback", () => {
    const existing: SessionRecord = {
      id: "s1",
      scenarioId: "a",
      taglishLevel: 1,
      startedAt: 1,
      endedAt: 2,
      transcript: [],
      feedback: null,
    };
    saveSession(existing);
    const incoming: SessionRecord = {
      ...existing,
      endedAt: 2, // same endedAt - only the feedback differs
      feedback: { summary: "s", wins: [], corrections: [], vocab: [], encouragement: "e" },
    };
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [incoming],
      vocab: [],
      learner: defaultLearnerState(),
    };
    const result = restoreBackup(serializeBackup(backup), 0);
    expect(result.ok).toBe(true);
    expect(listSessions()).toHaveLength(1);
    expect(listSessions()[0].feedback).not.toBeNull();
  });

  it("on id+startedAt collision with feedback on both sides, prefers the later endedAt", () => {
    const existing: SessionRecord = {
      id: "s1",
      scenarioId: "a",
      taglishLevel: 1,
      startedAt: 1,
      endedAt: 100,
      transcript: [],
      feedback: { summary: "old", wins: [], corrections: [], vocab: [], encouragement: "e" },
    };
    saveSession(existing);
    const incoming: SessionRecord = {
      ...existing,
      endedAt: 200,
      feedback: { summary: "new", wins: [], corrections: [], vocab: [], encouragement: "e" },
    };
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [incoming],
      vocab: [],
      learner: defaultLearnerState(),
    };
    restoreBackup(serializeBackup(backup), 0);
    expect(listSessions()[0].feedback?.summary).toBe("new");
  });

  it("merges vocab by lowercase tagalog, existing wins", () => {
    addVocab([{ tagalog: "Kumusta", english: "existing", example: "e", scenarioId: "x", addedAt: 1 }]);
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [],
      vocab: [{ tagalog: "kumusta", english: "incoming", example: "e2", scenarioId: "y", addedAt: 2 }],
      learner: defaultLearnerState(),
    };
    restoreBackup(serializeBackup(backup), 0);
    const vocab = listVocab();
    expect(vocab).toHaveLength(1);
    expect(vocab[0].english).toBe("existing");
  });

  it("summary reports merged counts and resulting current unit", () => {
    const backup: BackupFile = {
      version: 1,
      exportedAt: 0,
      sessions: [],
      vocab: [],
      learner: { ...defaultLearnerState(), currentUnit: "u04" },
    };
    const result = restoreBackup(serializeBackup(backup), 0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary).toContain("u04");
  });

  it("guards browser-only access like lib/store.ts", () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    const result = restoreBackup(
      serializeBackup({ version: 1, exportedAt: 0, sessions: [], vocab: [], learner: defaultLearnerState() }),
      0
    );
    expect(result.ok).toBe(false);
  });
});

describe("mergeLearnerStates", () => {
  it("currentUnit: higher unitIndex wins; ties favor a", () => {
    const a = { ...defaultLearnerState(), currentUnit: "u02" };
    const b = { ...defaultLearnerState(), currentUnit: "u05" };
    expect(mergeLearnerStates(a, b).currentUnit).toBe("u05");
    expect(mergeLearnerStates(b, a).currentUnit).toBe("u05");
    const tieA = { ...defaultLearnerState(), currentUnit: "u03" };
    const tieB = { ...defaultLearnerState(), currentUnit: "u03" };
    expect(mergeLearnerStates(tieA, tieB).currentUnit).toBe("u03");
  });

  it("completedUnits: union, deduped, sorted", () => {
    const a = { ...defaultLearnerState(), completedUnits: ["u02", "u01"] };
    const b = { ...defaultLearnerState(), completedUnits: ["u01", "u03"] };
    expect(mergeLearnerStates(a, b).completedUnits).toEqual(["u01", "u02", "u03"]);
  });

  it("vocabSrs: keeps the entry with the higher box; tie favors earlier due", () => {
    const a = {
      ...defaultLearnerState(),
      vocabSrs: {
        kumusta: { box: 2, due: 500, lapses: 0 },
        salamat: { box: 3, due: 100, lapses: 1 },
      },
    };
    const b = {
      ...defaultLearnerState(),
      vocabSrs: {
        kumusta: { box: 4, due: 200, lapses: 0 },
        salamat: { box: 3, due: 50, lapses: 0 },
      },
    };
    const merged = mergeLearnerStates(a, b);
    expect(merged.vocabSrs.kumusta.box).toBe(4);
    expect(merged.vocabSrs.salamat.due).toBe(50);
  });

  it("errorLedger: takes max (not sum) of counts, max lastTs, unitId from the newer entry, unions examples capped at 3", () => {
    const a = {
      ...defaultLearnerState(),
      errorLedger: [
        {
          patternTag: "g-po-opo",
          count: 2,
          lastTs: T,
          unitId: "u01",
          examples: [
            { learnerSaid: "x1", target: "y1" },
            { learnerSaid: "x2", target: "y2" },
          ],
        },
      ],
    };
    const b = {
      ...defaultLearnerState(),
      errorLedger: [
        {
          patternTag: "g-po-opo",
          count: 3,
          lastTs: T + 100,
          unitId: "u02",
          examples: [
            { learnerSaid: "x2", target: "y2" },
            { learnerSaid: "x3", target: "y3" },
            { learnerSaid: "x4", target: "y4" },
          ],
        },
      ],
    };
    const merged = mergeLearnerStates(a, b);
    const entry = merged.errorLedger.find((e) => e.patternTag === "g-po-opo")!;
    // Max, not sum: mergeLearnerStates must be idempotent (merging a state
    // with itself, e.g. via a round-trip backup, must not double-count).
    expect(entry.count).toBe(3);
    expect(entry.lastTs).toBe(T + 100);
    expect(entry.unitId).toBe("u02");
    expect(entry.examples).toHaveLength(3);
  });

  it("errorLedger: two entries with equal lastTs (same history synced twice) merge to the same count, not a sum", () => {
    const a = {
      ...defaultLearnerState(),
      errorLedger: [
        { patternTag: "g-po-opo", count: 4, lastTs: T, unitId: "u01", examples: [{ learnerSaid: "x1", target: "y1" }] },
      ],
    };
    const b = {
      ...defaultLearnerState(),
      errorLedger: [
        { patternTag: "g-po-opo", count: 4, lastTs: T, unitId: "u01", examples: [{ learnerSaid: "x1", target: "y1" }] },
      ],
    };
    const merged = mergeLearnerStates(a, b);
    expect(merged.errorLedger.find((e) => e.patternTag === "g-po-opo")!.count).toBe(4);
  });

  it("canDoChecks: element-wise OR per unit key", () => {
    const a = { ...defaultLearnerState(), canDoChecks: { u01: [true, false] } };
    const b = { ...defaultLearnerState(), canDoChecks: { u01: [false, true], u02: [true] } };
    const merged = mergeLearnerStates(a, b);
    expect(merged.canDoChecks.u01).toEqual([true, true]);
    expect(merged.canDoChecks.u02).toEqual([true]);
  });

  it("sessionLog: concat, dedup by ts, sorted ascending", () => {
    const a = {
      ...defaultLearnerState(),
      sessionLog: [{ ts: T + 10, mode: "target" as const, unitId: "u01", corrections: 0, durationMin: 5 }],
    };
    const b = {
      ...defaultLearnerState(),
      sessionLog: [
        { ts: T, mode: "free" as const, unitId: "u01", corrections: 1, durationMin: 5 },
        { ts: T + 10, mode: "review" as const, unitId: "u02", corrections: 0, durationMin: 3 },
      ],
    };
    const merged = mergeLearnerStates(a, b);
    expect(merged.sessionLog.map((s) => s.ts)).toEqual([T, T + 10]);
    expect(merged.sessionLog).toHaveLength(2);
  });

  it("overrides: concat, dedup by ts", () => {
    const a = { ...defaultLearnerState(), overrides: [{ ts: T, unitId: "u01" }] };
    const b = {
      ...defaultLearnerState(),
      overrides: [
        { ts: T, unitId: "u01" },
        { ts: T + 5, unitId: "u02" },
      ],
    };
    const merged = mergeLearnerStates(a, b);
    expect(merged.overrides).toEqual([
      { ts: T, unitId: "u01" },
      { ts: T + 5, unitId: "u02" },
    ]);
  });

  it("lastSeedId: from whichever state has the later max sessionLog ts; falls back to a", () => {
    const a = {
      ...defaultLearnerState(),
      lastSeedId: "seed-a",
      sessionLog: [{ ts: T, mode: "target" as const, unitId: "u01", corrections: 0, durationMin: 5 }],
    };
    const b = {
      ...defaultLearnerState(),
      lastSeedId: "seed-b",
      sessionLog: [{ ts: T + 100, mode: "target" as const, unitId: "u01", corrections: 0, durationMin: 5 }],
    };
    expect(mergeLearnerStates(a, b).lastSeedId).toBe("seed-b");
    expect(mergeLearnerStates(b, a).lastSeedId).toBe("seed-b");

    const emptyA = { ...defaultLearnerState(), lastSeedId: "seed-a" };
    const emptyB = { ...defaultLearnerState(), lastSeedId: "seed-b" };
    expect(mergeLearnerStates(emptyA, emptyB).lastSeedId).toBe("seed-a");
  });
});

/** A learner state populated in every field, already in canonical (sorted/deduped) form. */
function richLearnerState() {
  return {
    ...defaultLearnerState(),
    currentUnit: "u04",
    completedUnits: ["u01", "u02", "u03"],
    vocabSrs: {
      kumusta: { box: 2, due: 500, lapses: 0 },
      salamat: { box: 3, due: 100, lapses: 1 },
    },
    errorLedger: [
      {
        patternTag: "g-po-opo",
        count: 3,
        lastTs: T,
        unitId: "u02",
        examples: [
          { learnerSaid: "x1", target: "y1" },
          { learnerSaid: "x2", target: "y2" },
        ],
      },
    ],
    sessionLog: [
      { ts: T - 10, mode: "target" as const, unitId: "u01", corrections: 0, durationMin: 5 },
      { ts: T, mode: "review" as const, unitId: "u02", corrections: 1, durationMin: 8 },
    ],
    canDoChecks: { u01: [true, true], u02: [true, false] },
    overrides: [{ ts: T - 10, unitId: "u01" }],
    lastSeedId: "seed-x",
  };
}

describe("merge idempotency", () => {
  beforeEach(() => {
    freshWindow();
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("mergeLearnerStates(s, s) deep-equals s", () => {
    const s = richLearnerState();
    expect(mergeLearnerStates(s, s)).toEqual(s);
  });

  it("restoring a just-built backup into unchanged stores changes nothing, counts included", () => {
    const session: SessionRecord = {
      id: "s1",
      scenarioId: "cooking",
      taglishLevel: 3,
      startedAt: 1000,
      endedAt: 2000,
      transcript: [],
      feedback: { summary: "s", wins: [], corrections: [], vocab: [], encouragement: "e" },
    };
    saveSession(session);
    const vocab: VocabItem = {
      tagalog: "kumusta",
      english: "how are you",
      example: "Kumusta ka?",
      scenarioId: "cooking",
      addedAt: 500,
    };
    addVocab([vocab]);
    const learner = richLearnerState();
    saveLearnerState(learner);

    const backup = buildBackup(9999);
    const json = serializeBackup(backup);

    // Restore the same backup back into the SAME (unchanged) stores it came from.
    const result = restoreBackup(json, 10000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toContain("Added 0 session");
      expect(result.summary).toContain("0 vocab");
    }

    expect(listSessions()).toHaveLength(1);
    expect(listSessions()[0]).toEqual(session);
    expect(listVocab()).toHaveLength(1);
    expect(loadLearnerState()).toEqual(learner);
  });
});
