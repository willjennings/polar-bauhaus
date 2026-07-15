import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, authHeaders, getApiKey } from "@/lib/openai-server";
import type { TranscriptEntry } from "@/lib/types";

// On Azure this is the *deployment name*, not the model name.
const FEEDBACK_MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "wins", "corrections", "vocab", "encouragement"],
  properties: {
    summary: {
      type: "string",
      description: "Two or three sentences on how the conversation went and what to focus on next.",
    },
    wins: {
      type: "array",
      items: { type: "string" },
      description:
        "2-5 specific things the learner successfully produced or communicated in Tagalog/Taglish — quote their actual words where possible. Always find real wins.",
    },
    corrections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["youSaid", "better", "note"],
        properties: {
          youSaid: { type: "string" },
          better: { type: "string", description: "A more natural Tagalog/Taglish phrasing." },
          note: { type: "string", description: "One-line grammar or usage note (focus/aspect, enclitics like na/pa/din, po/opo, word choice)." },
        },
      },
    },
    vocab: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tagalog", "english", "example"],
        properties: {
          tagalog: { type: "string" },
          english: { type: "string" },
          example: { type: "string", description: "A short example sentence using the word." },
        },
      },
    },
    encouragement: { type: "string", description: "One warm sentence, may include Tagalog." },
  },
} as const;

export async function POST(req: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key set. Add OPENAI_API_KEY or FOUNDRY_API_KEY to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const transcript: TranscriptEntry[] = Array.isArray(body.transcript) ? body.transcript : [];
  const learnerLines = transcript.filter((t) => t.speaker === "you" && t.text.trim());
  if (learnerLines.length === 0) {
    return NextResponse.json({ error: "No learner speech to review." }, { status: 400 });
  }

  const dialogue = transcript
    .map((t) => `${t.speaker === "you" ? "LEARNER" : "PARTNER"}: ${t.text}`)
    .join("\n");

  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      ...authHeaders(apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FEEDBACK_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a supportive Tagalog tutor reviewing a voice-conversation transcript from a heritage learner " +
            "(understands a lot, struggles to produce; their home Taglish register is the target variety, NOT " +
            "textbook Tagalog). Review ONLY the LEARNER lines, strengths first: begin by finding 2-5 genuine wins — " +
            "things they successfully produced or communicated, quoting their words. Then pick the 3-6 most useful " +
            "corrections of GENUINE errors only (broken verb forms, wrong markers, wrong words). Code-switching into " +
            "English is never an error — do not correct it; at most, offer the Tagalog version as an additive " +
            "'you could also say'. Natural colloquial phrasing beats textbook forms. Extract up to 8 vocabulary " +
            "items worth keeping, prioritizing words the partner taught or the learner reached for. Transcripts come " +
            "from speech recognition, so ignore likely mis-transcriptions rather than correcting them.",
        },
        { role: "user", content: dialogue },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "session_feedback", strict: true, schema: FEEDBACK_SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("feedback request failed:", res.status, detail);
    return NextResponse.json(
      { error: `Feedback generation failed (${res.status}).` },
      { status: 502 }
    );
  }

  const data = await res.json();
  try {
    const feedback = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({ error: "Could not parse feedback." }, { status: 502 });
  }
}
