import { describe, it, expect } from "vitest";
import { buildStatusMarkdown } from "@/lib/exportStatus";
import { defaultLearnerState, logSession, recordCorrections } from "@/lib/learner";

const WEEK = 7 * 24 * 60 * 60 * 1000;

describe("status export", () => {
  it("renders current unit, weekly sessions, target scores, top errors, and vocab counts", () => {
    let s = defaultLearnerState();
    const now = 1_700_000_000_000;
    s = logSession(s, { ts: now - 1000, mode: "target", unitId: "u01", corrections: 2, durationMin: 10, drillScores: { "g-po-opo": 85 } });
    s = logSession(s, { ts: now - WEEK - 1000, mode: "free", unitId: "u01", corrections: 1, durationMin: 8 }); // outside week
    s = recordCorrections(s, [{ learnerSaid: "kumusta ka po", target: "kumusta po kayo", patternTag: "g-po-opo" }], "u01", now);
    s = { ...s, vocabSrs: { kumusta: { box: 1, due: now - 1, lapses: 0 }, mabuti: { box: 3, due: now + WEEK, lapses: 0 } } };

    const md = buildStatusMarkdown(s, now);
    expect(md).toContain("# Kausap status");
    expect(md).toContain("u01");
    expect(md).toContain("Sessions this week: 1");
    expect(md).toContain("g-po-opo");
    expect(md).toContain("85");
    expect(md).toContain("Due now: 1");
  });
});
