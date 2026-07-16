/**
 * D-instrumentation: pure weekly rollups over the sessionLog for Tier 2
 * trend charts (UI wiring happens in Tier 2B). Calendar-agnostic 7-day
 * windows counted back from `now`, not calendar weeks.
 */
import type { SessionLogEntry } from "./learner";

export interface WeekTrend {
  weekStart: number;
  sessions: number;
  minutes: number;
  talkRatio: number | null;
  correctionsPer100: number | null;
  lifelinesPerSession: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export function computeTrends(log: SessionLogEntry[], now: number, weeks = 12): WeekTrend[] {
  interface Bucket {
    weekStart: number;
    weekEnd: number;
    sessions: number;
    minutes: number;
    // correctionsPer100 numerator: sum of corrections, but ONLY from entries
    // that also reported learnerWords — otherwise a legacy entry's
    // corrections would inflate the count without ever contributing to the
    // denominator below, skewing the ratio up.
    correctionsWithWords: number;
    // correctionsPer100 denominator: sum of learnerWords across entries that report it.
    correctionsLearnerWords: number;
    // talkRatio: only entries reporting BOTH learnerWords and partnerWords contribute.
    talkLearnerWords: number;
    talkTotalWords: number;
    lifelinesSum: number;
    lifelineEntries: number;
  }

  const buckets: Bucket[] = [];
  for (let k = 0; k < weeks; k++) {
    const weekEnd = now - (weeks - 1 - k) * WEEK_MS;
    buckets.push({
      weekStart: weekEnd - WEEK_MS,
      weekEnd,
      sessions: 0,
      minutes: 0,
      correctionsWithWords: 0,
      correctionsLearnerWords: 0,
      talkLearnerWords: 0,
      talkTotalWords: 0,
      lifelinesSum: 0,
      lifelineEntries: 0,
    });
  }

  for (const e of log) {
    // Right-open interval [weekStart, weekEnd): the newest bucket's weekEnd
    // is `now` itself, and entries exactly at `now` fall outside every
    // bucket (nothing can be logged "in the future" relative to `now`).
    const bucket = buckets.find((b) => e.ts >= b.weekStart && e.ts < b.weekEnd);
    if (!bucket) continue;

    bucket.sessions += 1;
    bucket.minutes += e.durationMin;

    if (e.learnerWords !== undefined) {
      bucket.correctionsWithWords += e.corrections;
      bucket.correctionsLearnerWords += e.learnerWords;
    }
    if (e.learnerWords !== undefined && e.partnerWords !== undefined) {
      bucket.talkLearnerWords += e.learnerWords;
      bucket.talkTotalWords += e.learnerWords + e.partnerWords;
    }
    if (e.lifelines !== undefined) {
      bucket.lifelinesSum += e.lifelines;
      bucket.lifelineEntries += 1;
    }
  }

  return buckets.map((b) => ({
    weekStart: b.weekStart,
    sessions: b.sessions,
    minutes: b.minutes,
    talkRatio: b.talkTotalWords > 0 ? b.talkLearnerWords / b.talkTotalWords : null,
    correctionsPer100:
      b.correctionsLearnerWords > 0 ? (100 * b.correctionsWithWords) / b.correctionsLearnerWords : null,
    lifelinesPerSession: b.lifelineEntries > 0 ? b.lifelinesSum / b.lifelineEntries : null,
  }));
}
