/** Leitner-box spaced repetition over vocab keys. Pure functions only. */

export interface SrsEntry {
  box: number; // 1..5
  due: number; // epoch ms
  lapses: number;
}

export const BOX_INTERVALS_DAYS = [1, 2, 4, 8, 16];

const DAY = 24 * 60 * 60 * 1000;

export function newEntry(now: number): SrsEntry {
  return { box: 1, due: now, lapses: 0 };
}

export function reviewResult(entry: SrsEntry, recalled: boolean, now: number): SrsEntry {
  const box = recalled ? Math.min(5, entry.box + 1) : 1;
  return {
    box,
    due: now + BOX_INTERVALS_DAYS[box - 1] * DAY,
    lapses: entry.lapses + (recalled ? 0 : 1),
  };
}

export function dueItems(
  srs: Record<string, SrsEntry>,
  now: number,
  limit = 12
): string[] {
  return Object.entries(srs)
    .filter(([, e]) => e.due <= now)
    .sort(([, a], [, b]) => a.due - b.due)
    .slice(0, limit)
    .map(([k]) => k);
}
