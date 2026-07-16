/**
 * Learner state for the curriculum spine (D2). Pure state transitions +
 * thin localStorage wrappers, following lib/store.ts conventions.
 * D2 reconciliation: all persistence in this app is client-side
 * localStorage; API routes stay stateless (context sent per request).
 */
import { CURRICULUM, getUnit, unitIndex } from "./curriculum";
import { newEntry, reviewResult, type SrsEntry } from "./srs";

const LEARNER_KEY = "kausap.learner";

export type Mode = "target" | "free" | "review";

export interface ErrorPattern {
  patternTag: string;
  count: number;
  lastTs: number;
  unitId: string;
  examples: { learnerSaid: string; target: string }[];
}

export interface SessionLogEntry {
  ts: number;
  mode: Mode;
  unitId: string;
  corrections: number;
  durationMin: number;
  drillScores?: Record<string, number>;
  /** Instrumentation added in Tier 2; UI wires these in Tier 2B. */
  lifelines?: number;
  learnerWords?: number;
  partnerWords?: number;
}

export interface LearnerState {
  currentUnit: string;
  completedUnits: string[];
  vocabSrs: Record<string, SrsEntry>;
  errorLedger: ErrorPattern[];
  sessionLog: SessionLogEntry[];
  canDoChecks: Record<string, boolean[]>;
  overrides: { ts: number; unitId: string }[];
  lastSeedId: string | null;
}

export function defaultLearnerState(): LearnerState {
  return {
    currentUnit: "u01",
    completedUnits: [],
    vocabSrs: {},
    errorLedger: [],
    sessionLog: [],
    canDoChecks: {},
    overrides: [],
    lastSeedId: null,
  };
}

export function loadLearnerState(): LearnerState {
  if (typeof window === "undefined") return defaultLearnerState();
  const raw = window.localStorage.getItem(LEARNER_KEY);
  if (!raw) return defaultLearnerState();
  try {
    return { ...defaultLearnerState(), ...(JSON.parse(raw) as LearnerState) };
  } catch {
    try {
      window.localStorage.setItem(`${LEARNER_KEY}.corrupt`, raw);
    } catch {
      // Best-effort backup of the corrupt payload; ignore secondary failure.
    }
    return defaultLearnerState();
  }
}

export function saveLearnerState(state: LearnerState) {
  window.localStorage.setItem(LEARNER_KEY, JSON.stringify(state));
}

export function recordCorrections(
  state: LearnerState,
  corrections: { learnerSaid: string; target: string; patternTag?: string }[],
  unitId: string,
  ts: number
): LearnerState {
  const ledger = state.errorLedger.map((e) => ({ ...e, examples: [...e.examples] }));
  for (const c of corrections) {
    if (!c.patternTag) continue;
    const existing = ledger.find((e) => e.patternTag === c.patternTag);
    if (existing) {
      existing.count += 1;
      existing.lastTs = ts;
      if (existing.examples.length < 3)
        existing.examples.push({ learnerSaid: c.learnerSaid, target: c.target });
    } else {
      ledger.push({
        patternTag: c.patternTag,
        count: 1,
        lastTs: ts,
        unitId,
        examples: [{ learnerSaid: c.learnerSaid, target: c.target }],
      });
    }
  }
  return { ...state, errorLedger: ledger };
}

export function topErrorTags(state: LearnerState, n = 3): ErrorPattern[] {
  return [...state.errorLedger].sort((a, b) => b.count - a.count).slice(0, n);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Like topErrorTags, but excludes patterns that haven't recurred recently. */
export function recentErrorFocus(
  state: LearnerState,
  now: number,
  n = 3,
  windowDays = 14
): ErrorPattern[] {
  const cutoff = now - windowDays * DAY_MS;
  return [...state.errorLedger]
    .filter((e) => e.lastTs >= cutoff)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Learner dismisses a shown correction: decrement its count, drop the entry at 0. */
export function dismissCorrection(
  state: LearnerState,
  patternTag: string,
  learnerSaid: string
): LearnerState {
  const idx = state.errorLedger.findIndex((e) => e.patternTag === patternTag);
  if (idx === -1) return state;
  const entry = state.errorLedger[idx];
  const nextCount = entry.count - 1;
  const ledger = [...state.errorLedger];
  if (nextCount <= 0) {
    ledger.splice(idx, 1);
  } else {
    ledger[idx] = {
      ...entry,
      count: nextCount,
      examples: entry.examples.filter((e) => e.learnerSaid !== learnerSaid),
    };
  }
  return { ...state, errorLedger: ledger };
}

/**
 * Adds SRS tracking for words not already present; never overwrites an
 * existing entry. New keys are lowercased so vocab that only differs by
 * capitalization (e.g. sentence-initial "Kumusta" vs "kumusta") folds into
 * one SRS entry; existing stored keys are left exactly as they are.
 */
export function foldVocabIntoSrs(
  state: LearnerState,
  words: string[],
  now: number
): LearnerState {
  const srs = { ...state.vocabSrs };
  for (const word of words) {
    const key = word.toLowerCase();
    if (!srs[key]) srs[key] = newEntry(now);
  }
  return { ...state, vocabSrs: srs };
}

/**
 * Filters vocabSrs down to keys not marked "replaced" by the family (owner
 * decision: replaced vocab stops being taught/reviewed, but its SRS history
 * is left untouched in state — only reads for due-item purposes are
 * filtered). `replaced` must already be lowercased; SRS keys are matched
 * case-insensitively since they're always lowercased on insert (see
 * foldVocabIntoSrs).
 */
export function activeSrsKeys(
  srs: Record<string, SrsEntry>,
  replaced: Set<string>
): Record<string, SrsEntry> {
  const out: Record<string, SrsEntry> = {};
  for (const [key, entry] of Object.entries(srs)) {
    if (replaced.has(key.toLowerCase())) continue;
    out[key] = entry;
  }
  return out;
}

/** Patches fields on the sessionLog entry matching ts; no-op if none matches. */
export function updateSessionLogEntry(
  state: LearnerState,
  ts: number,
  patch: Partial<SessionLogEntry>
): LearnerState {
  const idx = state.sessionLog.findIndex((e) => e.ts === ts);
  if (idx === -1) return state;
  const sessionLog = [...state.sessionLog];
  sessionLog[idx] = { ...sessionLog[idx], ...patch };
  return { ...state, sessionLog };
}

export function logSession(state: LearnerState, entry: SessionLogEntry): LearnerState {
  return { ...state, sessionLog: [...state.sessionLog, entry] };
}

export function applyReviewResults(
  state: LearnerState,
  results: { item: string; recalled: boolean }[],
  ts: number
): LearnerState {
  const srs = { ...state.vocabSrs };
  for (const r of results) {
    const entry = srs[r.item] ?? newEntry(ts);
    srs[r.item] = reviewResult(entry, r.recalled, ts);
  }
  return { ...state, vocabSrs: srs };
}

/** D6 advancement gate. Advisory-with-override; scores from M1 reports. */
export function canAdvance(state: LearnerState): { ok: boolean; reasons: string[] } {
  const unit = getUnit(state.currentUnit);
  const reasons: string[] = [];
  if (!unit) return { ok: false, reasons: ["unknown current unit"] };

  const checks = state.canDoChecks[unit.id] ?? [];
  const unchecked = unit.canDo.filter((_, i) => !checks[i]);
  if (unchecked.length > 0)
    reasons.push(`Can-do items not yet self-checked: ${unchecked.join("; ")}`);

  const targetScenes = state.sessionLog
    .filter((s) => s.mode === "target" && s.unitId === unit.id && s.drillScores)
    .slice(-2);
  if (targetScenes.length < 2) {
    reasons.push("Need two completed Target Scenes for this unit");
  } else {
    for (const t of unit.grammarTargets) {
      const measurements = targetScenes
        .map((d) => d.drillScores?.[t.id])
        .filter((s): s is number => s !== undefined);
      if (measurements.length < 2) {
        reasons.push(`Not yet measured twice in Target Scenes: ${t.id}`);
      } else if (measurements.some((s) => s < 80)) {
        reasons.push(`Accuracy below 80% on ${t.id} in the last two Target Scenes`);
      }
    }
  }

  const unitTags = new Set(unit.grammarTargets.map((t) => t.id));
  // The offending tag only blocks if it recurred during the last two Target
  // Scenes (i.e. it's still live), not merely at some point in all-time history.
  let offending: ErrorPattern[] = [];
  if (targetScenes.length >= 2) {
    const earliestQualifyingTs = targetScenes[0].ts;
    offending = topErrorTags(state, 3).filter(
      (e) => unitTags.has(e.patternTag) && e.lastTs >= earliestQualifyingTs
    );
  }
  if (offending.length > 0)
    reasons.push(
      `Current-unit patterns still in your top errors: ${offending.map((e) => e.patternTag).join(", ")}`
    );

  return { ok: reasons.length === 0, reasons };
}

/** Advance to the next unit; folds the finished unit's vocab into SRS. */
export function advanceUnit(
  state: LearnerState,
  opts: { override?: boolean; ts: number }
): LearnerState {
  const i = unitIndex(state.currentUnit);
  const unit = CURRICULUM[i];
  if (!unit) return state;
  if (state.completedUnits.includes(unit.id)) return state;

  const next = CURRICULUM[i + 1];
  const srs = { ...state.vocabSrs };
  for (const v of unit.vocab) {
    if (!srs[v.tl]) srs[v.tl] = newEntry(opts.ts);
  }
  return {
    ...state,
    currentUnit: next ? next.id : state.currentUnit,
    completedUnits: [...state.completedUnits, unit.id],
    vocabSrs: srs,
    overrides: opts.override
      ? [...state.overrides, { ts: opts.ts, unitId: unit.id }]
      : state.overrides,
  };
}
