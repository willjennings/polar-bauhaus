/**
 * Full-state backup: export everything the app persists (sessions, vocab,
 * learner state) and restore it back with a merge - never a destructive
 * overwrite - so importing an older or another device's backup can only
 * add ground truth, not erase progress. Follows lib/store.ts's browser-only
 * storage conventions.
 *
 * Merge idempotency: every merge in this module is designed so that
 * mergeLearnerStates(s, s) === s and restoring a backup taken from the
 * current state back into that same (unchanged) state is a no-op. This
 * matters because backup/restore round-trips (export then re-import on the
 * same device, or re-syncing two already-synced devices) are the common
 * case and must never inflate counters. In particular the error ledger's
 * count takes Math.max(a.count, b.count) rather than summing - this slightly
 * undercounts truly independent parallel histories from two devices that
 * both recorded the same pattern between syncs, but undercounting is the
 * safe direction for a gate input (worst case: one extra rep asked for,
 * never a false "you've got this").
 */
import { listSessions, listVocab, addVocab, saveSession } from "./store";
import {
  loadLearnerState,
  saveLearnerState,
  defaultLearnerState,
  type LearnerState,
  type ErrorPattern,
  type SessionLogEntry,
} from "./learner";
import type { SessionRecord, VocabItem } from "./types";
import { unitIndex } from "./curriculum";

export interface BackupFile {
  version: 1;
  exportedAt: number;
  sessions: SessionRecord[];
  vocab: VocabItem[];
  learner: LearnerState;
}

export function buildBackup(now: number): BackupFile {
  return {
    version: 1,
    exportedAt: now,
    sessions: listSessions(),
    vocab: listVocab(),
    learner: loadLearnerState(),
  };
}

export function serializeBackup(b: BackupFile): string {
  return JSON.stringify(b, null, 2);
}

function isValidBackup(x: unknown): x is BackupFile {
  if (!x || typeof x !== "object") return false;
  const b = x as Record<string, unknown>;
  if (b.version !== 1) return false;
  // sessions/vocab are tolerated as missing (older/partial backups) but must
  // be arrays when present - restoreBackup defaults an absent array to [].
  if (b.sessions !== undefined && !Array.isArray(b.sessions)) return false;
  if (b.vocab !== undefined && !Array.isArray(b.vocab)) return false;
  if (!b.learner || typeof b.learner !== "object") return false;
  if (typeof (b.learner as Record<string, unknown>).currentUnit !== "string") return false;
  return true;
}

function maxTs(log: SessionLogEntry[]): number {
  return log.reduce((max, e) => Math.max(max, e.ts), -Infinity);
}

function dedupeByTs<T extends { ts: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.ts)) continue;
    seen.add(item.ts);
    out.push(item);
  }
  return out;
}

function mergeSessionLogs(a: SessionLogEntry[], b: SessionLogEntry[]): SessionLogEntry[] {
  return dedupeByTs([...a, ...b]).sort((x, y) => x.ts - y.ts);
}

function exampleKey(ex: { learnerSaid: string; target: string }): string {
  return `${ex.learnerSaid}::${ex.target}`;
}

function mergeErrorLedgers(a: ErrorPattern[], b: ErrorPattern[]): ErrorPattern[] {
  const merged = new Map<string, ErrorPattern>();
  for (const e of a) merged.set(e.patternTag, { ...e, examples: [...e.examples] });
  for (const e of b) {
    const existing = merged.get(e.patternTag);
    if (!existing) {
      merged.set(e.patternTag, { ...e, examples: [...e.examples] });
      continue;
    }
    const lastTs = Math.max(existing.lastTs, e.lastTs);
    const unitId = e.lastTs > existing.lastTs ? e.unitId : existing.unitId;
    const seen = new Set(existing.examples.map(exampleKey));
    const examples = [...existing.examples];
    for (const ex of e.examples) {
      if (examples.length >= 3) break;
      const key = exampleKey(ex);
      if (seen.has(key)) continue;
      seen.add(key);
      examples.push(ex);
    }
    merged.set(e.patternTag, {
      patternTag: e.patternTag,
      // Max, not sum - see module header. Two merges of the *same* history
      // (e.g. a round-trip export/import) must not double-count.
      count: Math.max(existing.count, e.count),
      lastTs,
      unitId,
      examples,
    });
  }
  return [...merged.values()];
}

function mergeCanDoChecks(
  a: Record<string, boolean[]>,
  b: Record<string, boolean[]>
): Record<string, boolean[]> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Record<string, boolean[]> = {};
  for (const key of keys) {
    const av = a[key] ?? [];
    const bv = b[key] ?? [];
    const len = Math.max(av.length, bv.length);
    const combined: boolean[] = [];
    for (let i = 0; i < len; i++) combined.push(Boolean(av[i]) || Boolean(bv[i]));
    out[key] = combined;
  }
  return out;
}

/** Pure merge of two learner states, favoring the more-advanced/more-recent side per field. */
export function mergeLearnerStates(a: LearnerState, b: LearnerState): LearnerState {
  const currentUnit = unitIndex(b.currentUnit) > unitIndex(a.currentUnit) ? b.currentUnit : a.currentUnit;

  const completedUnits = [...new Set([...a.completedUnits, ...b.completedUnits])].sort();

  const vocabSrs: LearnerState["vocabSrs"] = { ...a.vocabSrs };
  for (const [key, bEntry] of Object.entries(b.vocabSrs)) {
    const aEntry = vocabSrs[key];
    if (!aEntry) {
      vocabSrs[key] = bEntry;
    } else if (bEntry.box > aEntry.box || (bEntry.box === aEntry.box && bEntry.due < aEntry.due)) {
      vocabSrs[key] = bEntry;
    }
  }

  const errorLedger = mergeErrorLedgers(a.errorLedger, b.errorLedger);
  const sessionLog = mergeSessionLogs(a.sessionLog, b.sessionLog);
  const canDoChecks = mergeCanDoChecks(a.canDoChecks, b.canDoChecks);
  const overrides = dedupeByTs([...a.overrides, ...b.overrides]);

  const aMaxTs = maxTs(a.sessionLog);
  const bMaxTs = maxTs(b.sessionLog);
  const lastSeedId = bMaxTs > aMaxTs ? b.lastSeedId : a.lastSeedId;

  return {
    currentUnit,
    completedUnits,
    vocabSrs,
    errorLedger,
    sessionLog,
    canDoChecks,
    overrides,
    lastSeedId,
  };
}

/** Same id + startedAt is a genuine collision (not just an id clash) - pick a winner instead of a blind existing-wins no-op. */
function pickSessionWinner(existing: SessionRecord, incoming: SessionRecord): SessionRecord {
  const existingHasFeedback = existing.feedback !== null;
  const incomingHasFeedback = incoming.feedback !== null;
  if (existingHasFeedback !== incomingHasFeedback) {
    return existingHasFeedback ? existing : incoming;
  }
  return incoming.endedAt > existing.endedAt ? incoming : existing;
}

/**
 * Pure planning step for merging incoming sessions into the store: union by
 * id, re-keying real collisions. Returns only the records that need to be
 * written - callers apply them with saveSession once every other merge in
 * the restore has also succeeded, so a mid-restore failure never leaves a
 * partial write.
 */
function planSessionMerge(incoming: SessionRecord[], existing: SessionRecord[]): SessionRecord[] {
  const existingById = new Map(existing.map((s) => [s.id, s]));
  const toWrite: SessionRecord[] = [];
  for (const s of incoming) {
    const match = existingById.get(s.id);
    if (!match) {
      toWrite.push(s);
      existingById.set(s.id, s);
    } else if (match.startedAt !== s.startedAt) {
      const reKeyed = { ...s, id: `${s.id}-imported-${s.startedAt}` };
      toWrite.push(reKeyed);
      existingById.set(reKeyed.id, reKeyed);
    } else {
      // Same id + startedAt: a genuine duplicate/collision (e.g. re-syncing
      // the same session after one side generated feedback for it later).
      const winner = pickSessionWinner(match, s);
      if (winner !== match) {
        toWrite.push(winner);
        existingById.set(s.id, winner);
      }
    }
  }
  return toWrite;
}

export function restoreBackup(
  json: string,
  // Reserved for future use (e.g. stamping merge provenance); the merge
  // logic itself is driven entirely by timestamps already in the records.
  _now: number
): { ok: true; summary: string } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  if (!isValidBackup(parsed)) {
    return { ok: false, error: "Invalid backup file" };
  }
  if (typeof window === "undefined") {
    return { ok: false, error: "No browser storage available" };
  }

  try {
    const incomingSessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    const incomingVocab = Array.isArray(parsed.vocab) ? parsed.vocab : [];
    // Normalize a possibly-partial incoming learner (older backup, hand-edited
    // file) against the current shape so every merge helper below can assume
    // every field exists.
    const incomingLearner: LearnerState = { ...defaultLearnerState(), ...parsed.learner };

    const beforeSessions = listSessions().length;
    const beforeVocab = listVocab().length;

    // Compute every merge into local variables FIRST - only once all of them
    // have succeeded do we touch storage, so a throw anywhere above never
    // leaves a partial write (some stores merged, others not).
    const sessionWrites = planSessionMerge(incomingSessions, listSessions());
    const mergedLearner = mergeLearnerStates(loadLearnerState(), incomingLearner);

    for (const s of sessionWrites) saveSession(s);
    addVocab(incomingVocab);
    saveLearnerState(mergedLearner);

    const addedSessions = listSessions().length - beforeSessions;
    const addedVocab = listVocab().length - beforeVocab;

    return {
      ok: true,
      summary: `Added ${addedSessions} session${addedSessions === 1 ? "" : "s"}, ${addedVocab} vocab; learner now ${mergedLearner.currentUnit}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Restore failed" };
  }
}
