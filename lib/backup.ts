/**
 * Full-state backup: export everything the app persists (sessions, vocab,
 * learner state) and restore it back with a merge - never a destructive
 * overwrite - so importing an older or another device's backup can only
 * add ground truth, not erase progress. Follows lib/store.ts's browser-only
 * storage conventions.
 */
import { listSessions, listVocab, addVocab, saveSession } from "./store";
import { loadLearnerState, saveLearnerState, type LearnerState, type ErrorPattern, type SessionLogEntry } from "./learner";
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
  if (!Array.isArray(b.sessions)) return false;
  if (!Array.isArray(b.vocab)) return false;
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
      count: existing.count + e.count,
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

/** Merges incoming sessions into the store: union by id, re-keying real collisions. */
function mergeSessionsIntoStore(incoming: SessionRecord[]): void {
  const existingById = new Map(listSessions().map((s) => [s.id, s]));
  for (const s of incoming) {
    const match = existingById.get(s.id);
    if (!match) {
      saveSession(s);
      existingById.set(s.id, s);
    } else if (match.startedAt !== s.startedAt) {
      const reKeyed = { ...s, id: `${s.id}-imported` };
      saveSession(reKeyed);
      existingById.set(reKeyed.id, reKeyed);
    }
    // else: same id + startedAt already present - no-op, existing wins.
  }
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

  const incoming = parsed;

  mergeSessionsIntoStore(incoming.sessions);
  addVocab(incoming.vocab);

  const mergedLearner = mergeLearnerStates(loadLearnerState(), incoming.learner);
  saveLearnerState(mergedLearner);

  return {
    ok: true,
    summary: `Merged ${incoming.sessions.length} sessions, ${incoming.vocab.length} vocab, learner state (now ${mergedLearner.currentUnit})`,
  };
}
