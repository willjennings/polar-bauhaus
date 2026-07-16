import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  listSessions,
  saveSession,
  listVocab,
  addVocab,
  updateVocab,
  pruneSessions,
} from "@/lib/store";
import type { SessionRecord, VocabItem } from "@/lib/types";

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
    _raw: map,
  };
}

let stub: ReturnType<typeof makeLocalStorageStub>;

function freshWindow() {
  stub = makeLocalStorageStub();
  (globalThis as unknown as { window: unknown }).window = { localStorage: stub };
}

function session(overrides: Partial<SessionRecord> & { id: string; startedAt: number }): SessionRecord {
  return {
    scenarioId: "s1",
    taglishLevel: 3,
    endedAt: overrides.startedAt + 1000,
    transcript: [{ id: "t1", speaker: "you", text: "hi", final: true }],
    feedback: null,
    ...overrides,
  };
}

describe("store", () => {
  beforeEach(() => {
    freshWindow();
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  describe("updateVocab", () => {
    it("merges a patch into the matching vocab item, matched case-insensitively", () => {
      addVocab([{ tagalog: "Kumusta", english: "how are you", example: "e", scenarioId: "x", addedAt: 1 }]);
      updateVocab("kumusta", { familyVerified: true });
      const item = listVocab().find((v) => v.tagalog === "Kumusta");
      expect(item?.familyVerified).toBe(true);
      // Unpatched fields survive.
      expect(item?.english).toBe("how are you");
    });

    it("is a no-op when no vocab item matches", () => {
      addVocab([{ tagalog: "salamat", english: "thanks", example: "e", scenarioId: "x", addedAt: 1 }]);
      updateVocab("wala-nito", { familyVerified: "replaced" });
      expect(listVocab()).toHaveLength(1);
      expect(listVocab()[0].familyVerified).toBeUndefined();
    });

    it("supports the 'replaced' familyVerified value", () => {
      addVocab([{ tagalog: "opo", english: "yes (polite)", example: "e", scenarioId: "x", addedAt: 1 }]);
      updateVocab("OPO", { familyVerified: "replaced" });
      expect(listVocab()[0].familyVerified).toBe("replaced");
    });
  });

  describe("pruneSessions", () => {
    const T = 1_700_000_000_000;

    it("keeps transcript on the most recent `keepFull` sessions", () => {
      for (let i = 0; i < 5; i++) {
        saveSession(session({ id: `s${i}`, startedAt: T + i, feedback: { summary: "s", corrections: [], vocab: [], encouragement: "e" } }));
      }
      pruneSessions(3);
      const byId = Object.fromEntries(listSessions().map((s) => [s.id, s]));
      // s4, s3, s2 are the 3 most recent by startedAt -> kept full.
      expect(byId["s4"].transcript.length).toBeGreaterThan(0);
      expect(byId["s3"].transcript.length).toBeGreaterThan(0);
      expect(byId["s2"].transcript.length).toBeGreaterThan(0);
    });

    it("strips transcript on older sessions that have feedback", () => {
      for (let i = 0; i < 5; i++) {
        saveSession(session({ id: `s${i}`, startedAt: T + i, feedback: { summary: "s", corrections: [], vocab: [], encouragement: "e" } }));
      }
      pruneSessions(3);
      const byId = Object.fromEntries(listSessions().map((s) => [s.id, s]));
      // s0, s1 are the 2 oldest -> stripped.
      expect(byId["s0"].transcript).toEqual([]);
      expect(byId["s1"].transcript).toEqual([]);
    });

    it("preserves transcript on an old session with null feedback (retry must stay possible)", () => {
      for (let i = 0; i < 5; i++) {
        saveSession(session({ id: `s${i}`, startedAt: T + i, feedback: { summary: "s", corrections: [], vocab: [], encouragement: "e" } }));
      }
      // Overwrite the oldest with null feedback.
      saveSession(session({ id: "s0", startedAt: T + 0, feedback: null }));
      pruneSessions(3);
      const byId = Object.fromEntries(listSessions().map((s) => [s.id, s]));
      expect(byId["s0"].transcript.length).toBeGreaterThan(0);
      expect(byId["s0"].feedback).toBeNull();
    });

    it("defaults keepFull to 30", () => {
      for (let i = 0; i < 5; i++) {
        saveSession(session({ id: `s${i}`, startedAt: T + i, feedback: { summary: "s", corrections: [], vocab: [], encouragement: "e" } }));
      }
      pruneSessions();
      const byId = Object.fromEntries(listSessions().map((s) => [s.id, s]));
      // Fewer than 30 sessions total -> nothing pruned.
      expect(byId["s0"].transcript.length).toBeGreaterThan(0);
    });
  });

  describe("corrupt-JSON hygiene", () => {
    it("backs up the raw corrupt string under `${key}.corrupt` and returns an empty list", () => {
      stub.setItem("kausap.sessions", "{not valid json");
      const result = listSessions();
      expect(result).toEqual([]);
      expect(stub.getItem("kausap.sessions.corrupt")).toBe("{not valid json");
    });

    it("does not throw even if the secondary backup write itself fails", () => {
      stub.setItem("kausap.vocab", "{also not valid");
      const originalSetItem = stub.setItem;
      stub.setItem = (k: string, v: string) => {
        if (k.endsWith(".corrupt")) throw new Error("quota exceeded");
        originalSetItem(k, v);
      };
      expect(() => listVocab()).not.toThrow();
      expect(listVocab()).toEqual([]);
    });

    it("does not touch the corrupt key when JSON is valid", () => {
      saveSession(session({ id: "s1", startedAt: 1 }));
      listSessions();
      expect(stub.getItem("kausap.sessions.corrupt")).toBeNull();
    });
  });
});
