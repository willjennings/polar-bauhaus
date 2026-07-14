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
  corrections: Correction[];
  vocab: Omit<VocabItem, "scenarioId" | "addedAt">[];
  encouragement: string;
}

export interface SessionRecord {
  id: string;
  scenarioId: string;
  taglishLevel: number;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  feedback: Feedback | null;
}
