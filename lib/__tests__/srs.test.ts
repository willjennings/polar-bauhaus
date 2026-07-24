import { describe, it, expect } from "vitest";
import { newEntry, reviewResult, dueItems, dueCount, BOX_INTERVALS_DAYS } from "@/lib/srs";

const DAY = 24 * 60 * 60 * 1000;

describe("srs", () => {
  it("new entries start in box 1, due immediately", () => {
    const e = newEntry(1000);
    expect(e).toEqual({ box: 1, due: 1000, lapses: 0 });
  });

  it("recall promotes a box and schedules by interval", () => {
    const e = reviewResult({ box: 2, due: 0, lapses: 0 }, true, 1000);
    expect(e.box).toBe(3);
    expect(e.due).toBe(1000 + BOX_INTERVALS_DAYS[2] * DAY); // box 3 → 4 days
  });

  it("recall caps at box 5", () => {
    const e = reviewResult({ box: 5, due: 0, lapses: 0 }, true, 0);
    expect(e.box).toBe(5);
  });

  it("failure demotes to box 1 and counts a lapse", () => {
    const e = reviewResult({ box: 4, due: 0, lapses: 1 }, false, 1000);
    expect(e).toEqual({ box: 1, due: 1000 + BOX_INTERVALS_DAYS[0] * DAY, lapses: 2 });
  });

  it("dueItems returns only due keys, most overdue first, capped by limit", () => {
    const srs = {
      a: { box: 1, due: 500, lapses: 0 },
      b: { box: 1, due: 100, lapses: 0 },
      c: { box: 1, due: 2000, lapses: 0 },
    };
    expect(dueItems(srs, 1000)).toEqual(["b", "a"]);
    expect(dueItems(srs, 1000, 1)).toEqual(["b"]);
  });

  it("dueCount counts all due items, ignoring dueItems's display cap", () => {
    const srs: Record<string, { box: number; due: number; lapses: number }> = {};
    for (let i = 0; i < 30; i++) srs[`k${i}`] = { box: 1, due: 100, lapses: 0 };
    srs["future"] = { box: 1, due: 5000, lapses: 0 };
    // dueItems caps at 12 by default; dueCount must see all 30 due, excluding the future one.
    expect(dueItems(srs, 1000).length).toBe(12);
    expect(dueCount(srs, 1000)).toBe(30);
  });
});
