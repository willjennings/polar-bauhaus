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
  try {
    const raw = window.localStorage.getItem(LEARNER_KEY);
    if (!raw) return defaultLearnerState();
    return { ...defaultLearnerState(), ...(JSON.parse(raw) as LearnerState) };
  } catch {
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
      const low = targetScenes.some((d) => (d.drillScores?.[t.id] ?? 0) < 80);
      if (low) reasons.push(`Accuracy below 80% on ${t.id} in the last two Target Scenes`);
    }
  }

  const unitTags = new Set(unit.grammarTargets.map((t) => t.id));
  const offending = topErrorTags(state, 3).filter((e) => unitTags.has(e.patternTag));
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
  const next = CURRICULUM[i + 1];
  if (!unit || !next) return state;

  const srs = { ...state.vocabSrs };
  for (const v of unit.vocab) {
    if (!srs[v.tl]) srs[v.tl] = newEntry(opts.ts);
  }
  return {
    ...state,
    currentUnit: next.id,
    completedUnits: [...state.completedUnits, unit.id],
    vocabSrs: srs,
    overrides: opts.override
      ? [...state.overrides, { ts: opts.ts, unitId: unit.id }]
      : state.overrides,
  };
}
