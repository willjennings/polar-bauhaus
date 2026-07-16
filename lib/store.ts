import type { SessionRecord, VocabItem } from "./types";

const SESSIONS_KEY = "kausap.sessions";
const VOCAB_KEY = "kausap.vocab";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (raw === null) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    try {
      window.localStorage.setItem(`${key}.corrupt`, raw);
    } catch {
      // Best-effort backup of the corrupt payload; ignore secondary failure.
    }
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

/** Case-insensitive match on tagalog; merges patch into the matching item. No-op if none matches. */
export function updateVocab(tagalog: string, patch: Partial<VocabItem>) {
  const items = read<VocabItem>(VOCAB_KEY);
  const idx = items.findIndex((v) => v.tagalog.toLowerCase() === tagalog.toLowerCase());
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...patch };
  write(VOCAB_KEY, items);
}

export function exportVocabJson(): string {
  return JSON.stringify(listVocab(), null, 2);
}

/**
 * Storage hygiene: sessions beyond the most recent `keepFull` (by startedAt)
 * have their transcript dropped to save space, but ONLY if either:
 *  - they already have feedback, or
 *  - they have null feedback AND no "you" speaker turn at all — a session
 *    that was skipped (no speech captured) can never be retried into real
 *    feedback (see app/sessions/[id]/page.tsx's "Generate feedback" button,
 *    which needs learner speech to work with), so keeping its empty-ish
 *    transcript around buys nothing.
 * A null-feedback session that DOES have learner speech keeps its
 * transcript so retry stays possible.
 */
export function pruneSessions(keepFull = 30) {
  const sessions = read<SessionRecord>(SESSIONS_KEY).sort((a, b) => b.startedAt - a.startedAt);
  const pruned = sessions.map((s, i) => {
    if (i < keepFull) return s;
    const hasFeedback = s.feedback !== null;
    const unretryableSkip = !hasFeedback && !s.transcript.some((e) => e.speaker === "you");
    return hasFeedback || unretryableSkip ? { ...s, transcript: [] } : s;
  });
  write(SESSIONS_KEY, pruned);
}
