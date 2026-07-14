# Kausap 🗣️

Personal Tagalog voice-practice app for heritage speakers — real-time spoken
roleplay with an AI conversation partner ("kausap"), built on the OpenAI
Realtime API over WebRTC.

You pick a scene (carinderia, palengke, jeepney, family reunion, calling Lola,
balikbayan arrival), set the **Taglish dial** (how much English your partner
mixes in), and just talk. When you're stuck mid-sentence, the **Lifeline**
button gets you the phrase you need without breaking the scene. After you hang
up, a feedback report shows what you said vs. how a native would say it, and
new words land in your **vocab log**.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your OpenAI API key
npm run dev
```

Open http://localhost:3000 in Chrome (or any browser with WebRTC + mic
support) and allow microphone access.

### Environment variables (`.env.local`)

| Variable         | Required | Default            | Purpose                                  |
| ---------------- | -------- | ------------------ | ---------------------------------------- |
| `OPENAI_API_KEY` | yes      | —                  | Server-side only; never sent to browser. |
| `REALTIME_MODEL` | no       | `gpt-realtime-2.1` | Realtime speech-to-speech model.         |
| `FEEDBACK_MODEL` | no       | `gpt-4o-mini`      | Model for post-session feedback.         |

## Two-minute smoke test

1. `npm run dev`, open the app, pick **Carinderia**, leave the dial at 3.
2. Click **Start conversation** and allow the mic. Aling Nena should greet you
   in Tagalog within a few seconds, and her words appear in the transcript.
3. Order something ("Isang sinigang po at kanin"), then tap **🛟 Lifeline** —
   she should briefly break character and teach you a phrase.
4. Click **📞 Hang up**. A feedback report appears with corrections and new
   vocab; check the **Vocab** tab to see the words saved.
5. Optional A/B: set `REALTIME_MODEL=gpt-realtime-2.1-mini` in `.env.local`
   (~3× cheaper), restart, and repeat — judge the accent, prosody, and Taglish
   mixing with your own ears. No public benchmark covers Tagalog synthesis
   quality, so your ears are the test.

## Notes

- **Cost:** Realtime audio is billed per token of input/output audio
  ($32/$64 per 1M audio tokens on `gpt-realtime-2.1`, $10/$20 on the mini —
  roughly $0.50–4 per conversation-hour). At 15–60 min/week expect about
  $1–16/month worst case. Sessions are designed to be short (5–10 min); keep
  an eye on your OpenAI usage dashboard.
- **Why this model:** realtime speech-to-speech models cannot be fine-tuned
  (no provider supports it); per-scenario system prompts are the sanctioned
  customization path, which is how Kausap works. Filipino ASR is genuinely
  hard for every vendor in 2026 (~2× English word-error rates on in-the-wild
  benchmarks), so occasional mis-recognition is expected — the feedback
  prompt is told to ignore likely transcription errors rather than "correct"
  them.
- **Fallback path:** if Tagalog synthesis quality disappoints on both 2.1 and
  mini, the escape hatch is a pipeline — streaming STT + text LLM +
  multilingual TTS — swapped in behind `lib/realtime.ts`'s interface. Not
  built; revisit only if needed.
- **Privacy/storage:** everything (sessions, transcripts, vocab) is stored in
  your browser's `localStorage` — there is no database and no accounts. Use
  the vocab page's **Export JSON** to back up words.
- The previous contents of this repo (a Processing.js world-clock experiment)
  live on in [`legacy/world-clock/`](legacy/world-clock/).

## Architecture

- `app/api/session/route.ts` — mints an ephemeral Realtime client secret with
  the scenario's system prompt; your API key stays server-side.
- `lib/realtime.ts` — browser WebRTC session: mic capture, remote audio,
  transcript events over the data channel, lifeline injection.
- `lib/scenarios.ts` — scenario definitions + Taglish-dial prompt builder.
- `app/api/feedback/route.ts` — turns the transcript into structured feedback
  (corrections, vocab) via a chat-completions call with a JSON schema.
- `lib/store.ts` — `localStorage` persistence for sessions and vocab.
