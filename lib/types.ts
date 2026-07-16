export type Speaker = "you" | "partner";

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  text: string;
  final: boolean;
}

export interface Correction {
  youSaid: string;
  better: string;
  note: string;
  /** Closed-set error category (curriculum target id or generic tag). */
  patternTag?: string;
}

export interface DrillScore {
  targetId: string;
  score: number; // 0-100
  evidence: string;
}

export interface ReviewResult {
  item: string;
  recalled: boolean;
}

export interface VocabItem {
  tagalog: string;
  english: string;
  example: string;
  scenarioId: string;
  addedAt: number;
}

export interface Feedback {
  summary: string;
  /** What the learner successfully produced — always shown first. */
  wins?: string[];
  corrections: Correction[];
  vocab: Omit<VocabItem, "scenarioId" | "addedAt">[];
  encouragement: string;
  drillScores?: DrillScore[];
  reviewResults?: ReviewResult[];
}

export interface SessionRecord {
  id: string;
  scenarioId: string;
  taglishLevel: number;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  feedback: Feedback | null;
  mode?: "target" | "free" | "review";
  unitId?: string;
  /** Vocab items under review in a review-mode session, so feedback on them can be retried later. */
  reviewItems?: string[];
}
