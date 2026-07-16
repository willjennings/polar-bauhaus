import { describe, it, expect } from "vitest";
import { computeTrends } from "@/lib/trends";
import type { SessionLogEntry } from "@/lib/learner";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const NOW = 1_700_000_000_000;

function entry(overrides: Partial<SessionLogEntry> & { ts: number }): SessionLogEntry {
  return {
    mode: "free",
    unitId: "u01",
    corrections: 0,
    durationMin: 0,
    ...overrides,
  };
}

describe("computeTrends", () => {
  it("returns `weeks` buckets, most recent last, ending at now", () => {
    const trends = computeTrends([], NOW, 12);
    expect(trends).toHaveLength(12);
    // The most recent bucket's window is [now - WEEK, now).
    expect(trends[11].weekStart).toBe(NOW - WEEK);
    // Buckets step back one week at a time.
    expect(trends[10].weekStart).toBe(NOW - 2 * WEEK);
    expect(trends[0].weekStart).toBe(NOW - 12 * WEEK);
  });

  it("buckets a session into the window containing its ts (right-open interval)", () => {
    // Falls in the most recent week.
    const recent = entry({ ts: NOW - 1, durationMin: 10 });
    // Falls exactly on the boundary between the last two weeks: belongs to the
    // more recent bucket (window start is inclusive).
    const onBoundary = entry({ ts: NOW - WEEK, durationMin: 20 });
    // Falls just before the boundary: belongs to the older bucket.
    const justBefore = entry({ ts: NOW - WEEK - 1, durationMin: 30 });

    const trends = computeTrends([recent, onBoundary, justBefore], NOW, 12);
    expect(trends[11].sessions).toBe(2); // recent + onBoundary
    expect(trends[11].minutes).toBe(30);
    expect(trends[10].sessions).toBe(1); // justBefore
    expect(trends[10].minutes).toBe(30);
  });

  it("excludes sessions entirely outside the covered range", () => {
    const tooOld = entry({ ts: NOW - 13 * WEEK, durationMin: 5 });
    const future = entry({ ts: NOW + 1, durationMin: 5 });
    const trends = computeTrends([tooOld, future], NOW, 12);
    const totalSessions = trends.reduce((sum, t) => sum + t.sessions, 0);
    expect(totalSessions).toBe(0);
  });

  it("legacy entries missing learnerWords/partnerWords/lifelines produce null ratios but still count sessions/minutes", () => {
    const legacy = entry({ ts: NOW - 100, durationMin: 15, corrections: 2 });
    const trends = computeTrends([legacy], NOW, 12);
    const bucket = trends[11];
    expect(bucket.sessions).toBe(1);
    expect(bucket.minutes).toBe(15);
    expect(bucket.talkRatio).toBeNull();
    expect(bucket.correctionsPer100).toBeNull();
    expect(bucket.lifelinesPerSession).toBeNull();
  });

  it("computes talkRatio from summed learnerWords/partnerWords across entries in a bucket", () => {
    const a = entry({ ts: NOW - 100, learnerWords: 30, partnerWords: 70 });
    const b = entry({ ts: NOW - 200, learnerWords: 10, partnerWords: 10 });
    const trends = computeTrends([a, b], NOW, 12);
    // learner: 40, total: 120 -> ratio 1/3
    expect(trends[11].talkRatio).toBeCloseTo(40 / 120, 10);
  });

  it("computes correctionsPer100 from sum(corrections)/sum(learnerWords) * 100", () => {
    const a = entry({ ts: NOW - 100, corrections: 3, learnerWords: 50, partnerWords: 50 });
    const b = entry({ ts: NOW - 200, corrections: 1, learnerWords: 50, partnerWords: 50 });
    const trends = computeTrends([a, b], NOW, 12);
    expect(trends[11].correctionsPer100).toBeCloseTo((100 * 4) / 100, 10);
  });

  it("correctionsPer100 is null when entries have corrections but no learnerWords data", () => {
    const a = entry({ ts: NOW - 100, corrections: 5 });
    const trends = computeTrends([a], NOW, 12);
    expect(trends[11].correctionsPer100).toBeNull();
  });

  it("computes lifelinesPerSession as average lifelines across entries that report it", () => {
    const a = entry({ ts: NOW - 100, lifelines: 2 });
    const b = entry({ ts: NOW - 200, lifelines: 4 });
    const c = entry({ ts: NOW - 300 }); // no lifeline data, doesn't contribute to the denominator
    const trends = computeTrends([a, b, c], NOW, 12);
    expect(trends[11].sessions).toBe(3);
    expect(trends[11].lifelinesPerSession).toBeCloseTo(3, 10); // (2+4)/2, not /3
  });

  it("a mix of legacy and instrumented entries only pulls null-safe data from the instrumented ones", () => {
    const legacy = entry({ ts: NOW - 50, durationMin: 10, corrections: 1 });
    const instrumented = entry({
      ts: NOW - 60,
      durationMin: 20,
      corrections: 2,
      learnerWords: 40,
      partnerWords: 60,
      lifelines: 1,
    });
    const trends = computeTrends([legacy, instrumented], NOW, 12);
    const bucket = trends[11];
    expect(bucket.sessions).toBe(2);
    expect(bucket.minutes).toBe(30);
    expect(bucket.talkRatio).toBeCloseTo(40 / 100, 10);
    expect(bucket.correctionsPer100).toBeCloseTo((100 * 3) / 40, 10);
    expect(bucket.lifelinesPerSession).toBeCloseTo(1, 10);
  });

  it("defaults to 12 weeks when not specified", () => {
    expect(computeTrends([], NOW)).toHaveLength(12);
  });
});
