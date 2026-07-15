import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, authHeaders, getApiKey } from "@/lib/openai-server";
import type { TranscriptEntry } from "@/lib/types";
import { allowedPatternTags, getUnit } from "@/lib/curriculum";

// On Azure this is the *deployment name*, not the model name.
const FEEDBACK_MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

const BASE_FEEDBACK_SCHEMA = {
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

function buildFeedbackSchema(opts: {
  tags: string[] | null;
  drillTargets: string[] | null;
  reviewItems: string[] | null;
}) {
  const schema = structuredClone(BASE_FEEDBACK_SCHEMA) as unknown as Record<string, unknown> & {
    properties: Record<string, unknown>;
    required: string[];
  };
  const corrections = schema.properties.corrections as {
    items: { properties: Record<string, unknown>; required: string[] };
  };
  if (opts.tags) {
    corrections.items.properties.patternTag = {
      type: "string",
      enum: opts.tags,
      description: "The single best-matching error category. Prefer a unit grammar-target id when one fits; otherwise the closest generic tag.",
    };
    corrections.items.required.push("patternTag");
  }
  if (opts.drillTargets) {
    schema.properties.drillScores = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["targetId", "score", "evidence"],
        properties: {
          targetId: { type: "string", enum: opts.drillTargets },
          score: { type: "integer", minimum: 0, maximum: 100, description: "Accuracy producing this pattern across the session." },
          evidence: { type: "string", description: "One-line justification quoting a learner utterance." },
        },
      },
    };
    schema.required.push("drillScores");
  }
  if (opts.reviewItems) {
    schema.properties.reviewResults = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "recalled"],
        properties: {
          item: { type: "string", enum: opts.reviewItems },
          recalled: { type: "boolean", description: "Did the learner successfully recall and use this item?" },
        },
      },
    };
    schema.required.push("reviewResults");
  }
  return schema;
}

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

  const MODES = ["target", "free", "review"] as const;
  const mode = MODES.includes(body.mode) ? (body.mode as (typeof MODES)[number]) : "free";
  const unit = typeof body.currentUnit === "string" ? getUnit(body.currentUnit) : undefined;
  const reviewItems: string[] = Array.isArray(body.reviewItems)
    ? body.reviewItems.filter((w: unknown) => typeof w === "string" && w.length <= 40).slice(0, 12)
    : [];

  const dialogue = transcript
    .map((t) => `${t.speaker === "you" ? "LEARNER" : "PARTNER"}: ${t.text}`)
    .join("\n");

  const tags = unit ? allowedPatternTags(unit.id) : null;
  const drillTargets = mode === "target" && unit ? unit.grammarTargets.map((t) => t.id) : null;
  const schema = buildFeedbackSchema({
    tags,
    drillTargets,
    reviewItems: mode === "review" && reviewItems.length > 0 ? reviewItems : null,
  });

  const curriculumNote = unit
    ? `\nThe learner follows a curriculum; current unit: ${unit.id} (${unit.title}). ` +
      `Tag every correction with exactly one patternTag from the allowed list. ` +
      `REMINDER, now enforced in the tags too: code-switching into English is NEVER an error, including English content words dropped into an otherwise Tagalog sentence and English words combined directly with Tagalog markers/particles (e.g. "about sa new project", "sa office", "ng project", "sa break room") — these are normal heritage-speaker Taglish, not word-order or vocab errors. Never emit a correction, and therefore never a patternTag, for any of this; only correct a sentence if it has a genuine Tagalog-side grammar error (wrong affix, wrong marker between two Tagalog words, wrong aspect) independent of the code-switching. ` +
      (drillTargets
        ? `This was a TARGET SCENE: additionally score the learner 0-100 on each grammar target (${drillTargets.join(", ")}) based on how accurately they produced it when the scene called for it; justify each score in one line quoting them. A target the scene never elicited scores by absence of evidence: 50 with a note. `
        : "") +
      (mode === "review" && reviewItems.length > 0
        ? `This was a REVIEW SPRINT probing these items: ${reviewItems.join(", ")}. For each, judge whether the learner recalled and used it (recalled=true/false). `
        : "")
    : "";

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
            "from speech recognition, so ignore likely mis-transcriptions rather than correcting them." +
            curriculumNote,
        },
        { role: "user", content: dialogue },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "session_feedback", strict: true, schema },
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
