import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/openai-server";
import { chatJson } from "@/lib/chatJson";
import { getUnit } from "@/lib/curriculum";

const MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

export const maxDuration = 300;

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

  const result = await chatJson({
    apiKey,
    model: MODEL,
    system:
      "You write short Tagalog conversation starters for a heritage learner to use with " +
      "their Filipina wife at a family dinner with young kids present. Prompts must use ONLY " +
      "grammar the learner has acquired (described below), sound natural and warm — questions " +
      "that invite stories, not quiz items. Original content only.",
    user:
      `Current unit ${unit.id}: ${unit.title}. Grammar targets: ` +
      unit.grammarTargets.map((t) => `${t.pattern} (frames: ${t.exampleFrames.join(" | ")})`).join("; ") +
      `. Unit vocab: ${unit.vocab.map((v) => v.tl).join(", ")}. ` +
      `Register notes: ${unit.registerNotes.join(" ")} ` +
      `Write 3-5 dinner-table prompts exercising this unit's grammar.`,
    schemaName: "lia_prep",
    schema: SCHEMA,
  });

  if (!result.ok) {
    return NextResponse.json({ error: `Generation failed (${result.status}).` }, { status: 502 });
  }
  return NextResponse.json(result.data);
}
