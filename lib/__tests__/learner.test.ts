import { describe, it, expect } from "vitest";
import {
  defaultLearnerState, recordCorrections, topErrorTags, logSession,
  applyReviewResults, canAdvance, advanceUnit,
} from "@/lib/learner";
import { getUnit } from "@/lib/curriculum";

const T = 1_700_000_000_000;

function stateOnU01WithPassedGate() {
  let s = defaultLearnerState();
  s = { ...s, canDoChecks: { u01: getUnit("u01")!.canDo.map(() => true) } };
  const scores = { "g-po-opo": 90, "g-pronoun-basics": 85 };
  s = logSession(s, { ts: T, mode: "target", unitId: "u01", corrections: 1, durationMin: 10, drillScores: scores });
  s = logSession(s, { ts: T + 1, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
  return s;
}

describe("learner state", () => {
  it("starts at u01 with empty ledger and no last seed", () => {
    const s = defaultLearnerState();
    expect(s.currentUnit).toBe("u01");
    expect(s.errorLedger).toEqual([]);
    expect(s.lastSeedId).toBeNull();
  });

  it("recordCorrections aggregates by patternTag and caps examples at 3", () => {
    let s = defaultLearnerState();
    const c = { learnerSaid: "ako ay kain", target: "kumain ako", patternTag: "g-um-aspect" };
    s = recordCorrections(s, [c, c, c, c], "u04", T);
    expect(s.errorLedger).toHaveLength(1);
    expect(s.errorLedger[0].count).toBe(4);
    expect(s.errorLedger[0].examples).toHaveLength(3);
  });

  it("corrections without patternTag are ignored by the ledger", () => {
    const s = recordCorrections(defaultLearnerState(), [{ learnerSaid: "x", target: "y" }], "u01", T);
    expect(s.errorLedger).toEqual([]);
  });

  it("topErrorTags sorts by count desc", () => {
    let s = defaultLearnerState();
    s = recordCorrections(s, [
      { learnerSaid: "a", target: "b", patternTag: "g-word-order" },
      { learnerSaid: "a", target: "b", patternTag: "g-po-opo" },
      { learnerSaid: "a", target: "b", patternTag: "g-po-opo" },
    ], "u01", T);
    expect(topErrorTags(s, 2).map((e) => e.patternTag)).toEqual(["g-po-opo", "g-word-order"]);
  });

  it("applyReviewResults updates SRS boxes", () => {
    let s = defaultLearnerState();
    s = { ...s, vocabSrs: { kumusta: { box: 2, due: 0, lapses: 0 } } };
    s = applyReviewResults(s, [{ item: "kumusta", recalled: true }], T);
    expect(s.vocabSrs["kumusta"].box).toBe(3);
  });

  it("canAdvance blocks a fresh state with reasons", () => {
    const g = canAdvance(defaultLearnerState());
    expect(g.ok).toBe(false);
    expect(g.reasons.length).toBeGreaterThan(0);
  });

  it("canAdvance passes when can-dos checked, two target-scene reports >=80, no current-unit tag in top 3", () => {
    expect(canAdvance(stateOnU01WithPassedGate()).ok).toBe(true);
  });

  it("canAdvance blocks when a current-unit tag is in the ledger top 3", () => {
    let s = stateOnU01WithPassedGate();
    s = recordCorrections(s, [{ learnerSaid: "x", target: "y", patternTag: "g-po-opo" }], "u01", T);
    expect(canAdvance(s).ok).toBe(false);
  });

  it("advanceUnit folds unit vocab into SRS and moves the pointer", () => {
    const s2 = advanceUnit(stateOnU01WithPassedGate(), { ts: T });
    expect(s2.currentUnit).toBe("u02");
    expect(s2.completedUnits).toContain("u01");
    expect(s2.vocabSrs["kumusta"]).toBeDefined(); // u01 vocab folded in
    expect(s2.overrides).toEqual([]);
  });

  it("advanceUnit with override logs the override", () => {
    const s2 = advanceUnit(defaultLearnerState(), { override: true, ts: T });
    expect(s2.currentUnit).toBe("u02");
    expect(s2.overrides).toEqual([{ ts: T, unitId: "u01" }]);
  });

  // F1: the error ledger's top-3 check should only block when the offending
  // tag recurred during the last two Target Scenes, not any time in history.
  it("canAdvance opens the gate when the offending tag was recorded before both qualifying drills", () => {
    let s = defaultLearnerState();
    s = { ...s, canDoChecks: { u01: getUnit("u01")!.canDo.map(() => true) } };
    // Error recorded first, well before either qualifying Target Scene.
    s = recordCorrections(s, [{ learnerSaid: "x", target: "y", patternTag: "g-po-opo" }], "u01", T - 100);
    const scores = { "g-po-opo": 90, "g-pronoun-basics": 85 };
    s = logSession(s, { ts: T, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
    s = logSession(s, { ts: T + 1, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
    expect(canAdvance(s).ok).toBe(true);
  });

  it("canAdvance blocks when the offending tag recurred after the first qualifying drill", () => {
    let s = defaultLearnerState();
    s = { ...s, canDoChecks: { u01: getUnit("u01")!.canDo.map(() => true) } };
    const scores = { "g-po-opo": 90, "g-pronoun-basics": 85 };
    s = logSession(s, { ts: T, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
    // Error recorded after the first qualifying Target Scene (still before the second).
    s = recordCorrections(s, [{ learnerSaid: "x", target: "y", patternTag: "g-po-opo" }], "u01", T + 0.5);
    s = logSession(s, { ts: T + 1, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
    expect(canAdvance(s).ok).toBe(false);
    expect(canAdvance(s).reasons.join(" ")).toContain("g-po-opo");
  });

  // F2b: a target missing from a drill session's scores must not be treated
  // as a 0 — it should report as "not yet measured" rather than "below 80%".
  it("canAdvance reports 'not yet measured' when a target is missing from Target Scene drill scores", () => {
    let s = defaultLearnerState();
    s = { ...s, canDoChecks: { u01: getUnit("u01")!.canDo.map(() => true) } };
    // Both sessions score g-po-opo, but neither ever measures g-pronoun-basics.
    s = logSession(s, { ts: T, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: { "g-po-opo": 90 } });
    s = logSession(s, { ts: T + 1, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: { "g-po-opo": 90 } });
    const g = canAdvance(s);
    expect(g.ok).toBe(false);
    expect(g.reasons.join(" ")).toContain("Not yet measured twice in Target Scenes: g-pronoun-basics");
    expect(g.reasons.join(" ")).not.toContain("Accuracy below 80% on g-pronoun-basics");
  });

  // F6: advanceUnit on the final unit (u10) has no "next" unit — it should
  // still fold vocab + record completion instead of being a no-op forever.
  it("advanceUnit on the final unit (u10) folds vocab, marks it completed, and stays on u10", () => {
    let s = defaultLearnerState();
    s = { ...s, currentUnit: "u10" };
    const s2 = advanceUnit(s, { ts: T });
    expect(s2.completedUnits).toContain("u10");
    expect(s2.vocabSrs["kasi"]).toBeDefined(); // u10 vocab folded into SRS
    expect(s2.currentUnit).toBe("u10");
  });

  it("advanceUnit on an already-completed unit is a no-op", () => {
    let s = defaultLearnerState();
    s = { ...s, currentUnit: "u10" };
    const s2 = advanceUnit(s, { ts: T });
    const s3 = advanceUnit(s2, { ts: T + 1 });
    expect(s3).toEqual(s2);
    expect(s3.completedUnits.filter((u) => u === "u10")).toHaveLength(1);
  });
});
