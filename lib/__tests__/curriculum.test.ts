import { describe, it, expect } from "vitest";
import {
  CURRICULUM, GENERIC_PATTERN_TAGS, getUnit, unitIndex, acquiredUnits,
  allowedPatternTags, defaultLevelForUnit, getSeed, pickSeed, seedToScenario,
  resolveScenario, validateCurriculum,
} from "@/lib/curriculum";

describe("curriculum spine", () => {
  it("has 10 strictly ordered units u01..u10", () => {
    expect(CURRICULUM.map((u) => u.id)).toEqual(
      ["u01","u02","u03","u04","u05","u06","u07","u08","u09","u10"]
    );
  });

  it("passes its own validation", () => {
    expect(validateCurriculum(CURRICULUM)).toEqual([]);
  });

  it("validateCurriculum catches missing recycleFrom on u03+", () => {
    const broken = CURRICULUM.map((u) => (u.id === "u05" ? { ...u, recycleFrom: [] } : u));
    expect(validateCurriculum(broken).join(" ")).toContain("u05");
  });

  it("validateCurriculum catches a target with fewer than 2 example frames", () => {
    const broken = CURRICULUM.map((u) =>
      u.id === "u06"
        ? { ...u, grammarTargets: [{ ...u.grammarTargets[0], exampleFrames: ["one"] }] }
        : u
    );
    expect(validateCurriculum(broken).join(" ")).toContain("u06");
  });

  it("validateCurriculum catches a unit with fewer than 2 scene seeds", () => {
    const broken = CURRICULUM.map((u) =>
      u.id === "u04" ? { ...u, sceneSeeds: u.sceneSeeds.slice(0, 1) } : u
    );
    expect(validateCurriculum(broken).join(" ")).toContain("u04");
  });

  it("acquiredUnits(u03) returns u01..u03", () => {
    expect(acquiredUnits("u03").map((u) => u.id)).toEqual(["u01","u02","u03"]);
  });

  it("allowedPatternTags includes acquired target ids and generic tags, not future ones, deduped", () => {
    const tags = allowedPatternTags("u03");
    expect(tags).toContain("g-mag-aspect");        // u03 target
    expect(tags).toContain("g-ang-ng-confusion");  // generic
    expect(tags).not.toContain("g-in-aspect");     // u06 target — future
    expect(new Set(tags).size).toBe(tags.length);  // no duplicates
  });

  it("defaultLevelForUnit ramps 2 → 5", () => {
    expect(defaultLevelForUnit("u01")).toBe(2);
    expect(defaultLevelForUnit("u04")).toBe(3);
    expect(defaultLevelForUnit("u07")).toBe(4);
    expect(defaultLevelForUnit("u10")).toBe(5);
  });

  it("getSeed finds a seed with its unit", () => {
    const hit = getSeed("s-adobo");
    expect(hit?.unit.id).toBe("u06");
    expect(hit?.seed.id).toBe("s-adobo");
  });

  it("pickSeed rotates and never repeats the last-used seed", () => {
    const u06 = getUnit("u06")!;
    const first = pickSeed("u06", null)!;
    expect(first.id).toBe(u06.sceneSeeds[0].id);
    const second = pickSeed("u06", first.id)!;
    expect(second.id).not.toBe(first.id);
    // wraps around
    const last = u06.sceneSeeds[u06.sceneSeeds.length - 1];
    expect(pickSeed("u06", last.id)!.id).toBe(u06.sceneSeeds[0].id);
  });

  it("seedToScenario produces a Scenario shape buildInstructions can consume", () => {
    const { unit, seed } = getSeed("s-adobo")!;
    const sc = seedToScenario(seed, unit);
    expect(sc.id).toBe("s-adobo");
    expect(sc.scene).toContain(seed.setting);
    expect(sc.opening).toBe(seed.opening);
    expect(sc.voice).toBe(seed.voice);
  });

  it("getUnit and unitIndex behave for unknown ids", () => {
    expect(getUnit("u99")).toBeUndefined();
    expect(unitIndex("u99")).toBe(-1);
  });

  // F7: session history stores whatever id the practice session used, which
  // may be a curriculum scene seed id (not present in SCENARIOS) or a
  // curated SCENARIOS id — resolveScenario should handle both plus unknowns.
  it("resolveScenario resolves a curriculum scene seed id", () => {
    expect(resolveScenario("s-adobo")?.description).toContain("adobo");
  });

  it("resolveScenario resolves a curated SCENARIOS id", () => {
    expect(resolveScenario("cooking")?.id).toBe("cooking");
  });

  it("resolveScenario returns undefined for an unknown id", () => {
    expect(resolveScenario("no-such-scenario")).toBeUndefined();
  });
});
