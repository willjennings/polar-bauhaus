import type { SessionRecord, VocabItem } from "./types";

const SESSIONS_KEY = "kausap.sessions";
const VOCAB_KEY = "kausap.vocab";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function listSessions(): SessionRecord[] {
  return read<SessionRecord>(SESSIONS_KEY).sort((a, b) => b.startedAt - a.startedAt);
}

export function getSession(id: string): SessionRecord | undefined {
  return read<SessionRecord>(SESSIONS_KEY).find((s) => s.id === id);
}

export function saveSession(record: SessionRecord) {
  const sessions = read<SessionRecord>(SESSIONS_KEY).filter((s) => s.id !== record.id);
  sessions.push(record);
  write(SESSIONS_KEY, sessions);
}

export function listVocab(): VocabItem[] {
  return read<VocabItem>(VOCAB_KEY).sort((a, b) => b.addedAt - a.addedAt);
}

export function addVocab(items: VocabItem[]) {
  const existing = read<VocabItem>(VOCAB_KEY);
  const known = new Set(existing.map((v) => v.tagalog.toLowerCase()));
  const fresh = items.filter((v) => !known.has(v.tagalog.toLowerCase()));
  write(VOCAB_KEY, [...existing, ...fresh]);
}

export function removeVocab(tagalog: string) {
  write(
    VOCAB_KEY,
    read<VocabItem>(VOCAB_KEY).filter((v) => v.tagalog !== tagalog)
  );
}

export function exportVocabJson(): string {
  return JSON.stringify(listVocab(), null, 2);
}
