import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, authHeaders, getApiKey } from "@/lib/openai-server";
import { getUnit } from "@/lib/curriculum";

const MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["prompts"],
  properties: {
    prompts: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tagalog", "english"],
        properties: {
          tagalog: { type: "string", description: "A conversation prompt in Tagalog the learner can say at the dinner table." },
          english: { type: "string", description: "English gloss of the prompt." },
        },
      },
    },
  },
};

export async function POST(req: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "No API key set." }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const unit = typeof body.currentUnit === "string" ? getUnit(body.currentUnit) : undefined;
  if (!unit) return NextResponse.json({ error: "Unknown unit." }, { status: 400 });

  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You write short Tagalog conversation starters for a heritage learner to use with " +
            "their Filipina wife at a family dinner with young kids present. Prompts must use ONLY " +
            "grammar the learner has acquired (described below), sound natural and warm — questions " +
            "that invite stories, not quiz items. Original content only.",
        },
        {
          role: "user",
          content:
            `Current unit ${unit.id}: ${unit.title}. Grammar targets: ` +
            unit.grammarTargets.map((t) => `${t.pattern} (frames: ${t.exampleFrames.join(" | ")})`).join("; ") +
            `. Unit vocab: ${unit.vocab.map((v) => v.tl).join(", ")}. ` +
            `Register notes: ${unit.registerNotes.join(" ")} ` +
            `Write 3-5 dinner-table prompts exercising this unit's grammar.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "lia_prep", strict: true, schema: SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    console.error("lia-prep failed:", res.status, await res.text());
    return NextResponse.json({ error: `Generation failed (${res.status}).` }, { status: 502 });
  }
  const data = await res.json();
  try {
    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch {
    return NextResponse.json({ error: "Could not parse prompts." }, { status: 502 });
  }
}
