import { NextRequest, NextResponse } from "next/server";
import { buildInstructions, getScenario } from "@/lib/scenarios";

const REALTIME_MODEL = process.env.REALTIME_MODEL ?? "gpt-realtime";

/**
 * Mints an ephemeral Realtime client secret for one practice session.
 * The real OPENAI_API_KEY never leaves the server.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  }
  const taglishLevel = Math.min(5, Math.max(1, Number(body.taglishLevel) || 3));

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions: buildInstructions(scenario, taglishLevel),
        audio: {
          input: {
            transcription: { model: "gpt-4o-transcribe" },
          },
          output: { voice: scenario.voice },
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("client_secrets failed:", res.status, detail);
    return NextResponse.json(
      { error: `OpenAI session request failed (${res.status}).` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ clientSecret: data.value, model: REALTIME_MODEL });
}
