// lib/__tests__/curriculumPrompt.test.ts
import { describe, it, expect } from "vitest";
import { buildCurriculumBlocks } from "@/lib/curriculumPrompt";

describe("curriculum prompt blocks", () => {
  it("includes elicitation goals for the current unit and a SOFT scope preference", () => {
    const s = buildCurriculumBlocks({ mode: "free", currentUnit: "u03", errorFocus: [] });
    expect(s).toContain("u03");
    expect(s).toContain("mag-");            // current unit payload present
    expect(s.toLowerCase()).toContain("prefer");   // soft preference, not a contract
    expect(s).not.toContain("kakainin");    // u06 frame must not leak
  });

  it("includes recycling directive when the unit has recycleFrom", () => {
    const s = buildCurriculumBlocks({ mode: "free", currentUnit: "u06", errorFocus: [] });
    expect(s).toContain("Recycle");
    expect(s).toContain("u05");
  });

  it("includes error focus items when provided", () => {
    const s = buildCurriculumBlocks({
      mode: "free", currentUnit: "u04",
      errorFocus: [{ patternTag: "g-um-aspect", example: "ako ay kain" }],
    });
    expect(s).toContain("g-um-aspect");
  });

  it("target mode adds elicitation directives for each current-unit target", () => {
    const s = buildCurriculumBlocks({ mode: "target", currentUnit: "u06", errorFocus: [] });
    expect(s).toContain("TARGET SCENE");
    expect(s).toContain("g-in-aspect");
  });

  it("review mode lists the items to probe", () => {
    const s = buildCurriculumBlocks({
      mode: "review", currentUnit: "u05", errorFocus: [], reviewItems: ["palengke", "kusina"],
    });
    expect(s).toContain("palengke");
    expect(s).toContain("kusina");
  });

  it("returns empty string for unknown unit", () => {
    expect(buildCurriculumBlocks({ mode: "free", currentUnit: "u99", errorFocus: [] })).toBe("");
  });

  it("review mode with no due items renders no review sprint block", () => {
    const s = buildCurriculumBlocks({
      mode: "review", currentUnit: "u05", errorFocus: [], reviewItems: [],
    });
    expect(s).not.toContain("REVIEW SPRINT");
  });
});
