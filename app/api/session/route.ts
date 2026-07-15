import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, WEBRTC_CALLS_URL, authHeaders, getApiKey } from "@/lib/openai-server";
import { buildInstructions, getScenario, VOICES } from "@/lib/scenarios";

// On Azure this is the *deployment name*, not the model name.
const REALTIME_MODEL = process.env.REALTIME_MODEL ?? "gpt-realtime-2.1";
const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL ?? "gpt-4o-transcribe";

/**
 * Mints an ephemeral Realtime client secret for one practice session.
 * The real OPENAI_API_KEY never leaves the server.
 */
export async function POST(req: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key set. Add OPENAI_API_KEY or FOUNDRY_API_KEY to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  }
  const taglishLevel = Math.min(5, Math.max(1, Number(body.taglishLevel) || 3));
  const voice = VOICES.includes(body.voice) ? body.voice : scenario.voice;
  const reviewVocab: string[] = Array.isArray(body.reviewVocab)
    ? body.reviewVocab
        .filter((w: unknown) => typeof w === "string" && w.length <= 40)
        .slice(0, 8)
    : [];

  const res = await fetch(`${API_BASE_URL}/realtime/client_secrets`, {
    method: "POST",
    headers: {
      ...authHeaders(apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions: buildInstructions(scenario, taglishLevel, reviewVocab),
        audio: {
          input: {
            transcription: { model: TRANSCRIBE_MODEL },
          },
          output: { voice },
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("client_secrets failed:", res.status, detail);
    return NextResponse.json(
      { error: `Realtime session request failed (${res.status}).` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    clientSecret: data.value,
    model: REALTIME_MODEL,
    webrtcUrl: WEBRTC_CALLS_URL,
  });
}
