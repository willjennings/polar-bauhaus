import type { TranscriptEntry } from "./types";

export type SessionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "ended"
  | "error";

export interface RealtimeCallbacks {
  onStatus: (status: SessionStatus, detail?: string) => void;
  onTranscript: (entry: TranscriptEntry) => void;
}

interface RealtimeEvent {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
}

const OPENAI_WEBRTC_URL = "https://api.openai.com/v1/realtime/calls";

/**
 * Manages one voice conversation: mints an ephemeral token via our API route,
 * opens a WebRTC peer connection to OpenAI Realtime, and surfaces transcript
 * events from the data channel.
 */
export class RealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private callbacks: RealtimeCallbacks;

  constructor(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(scenarioId: string, taglishLevel: number, voice?: string): Promise<void> {
    this.callbacks.onStatus("connecting", "Requesting session…");

    const tokenRes = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, taglishLevel, voice }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      throw new Error(body.error ?? `Session request failed (${tokenRes.status})`);
    }
    const { clientSecret, model } = await tokenRes.json();

    this.callbacks.onStatus("connecting", "Requesting microphone…");
    this.mic = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.callbacks.onStatus("connecting", "Connecting to voice service…");
    const pc = new RTCPeerConnection();
    this.pc = pc;

    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    pc.ontrack = (e) => {
      if (this.audioEl) this.audioEl.srcObject = e.streams[0];
    };

    for (const track of this.mic.getTracks()) {
      pc.addTrack(track, this.mic);
    }

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    dc.onmessage = (e) => this.handleEvent(e.data);
    dc.onopen = () => this.callbacks.onStatus("live");

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        this.callbacks.onStatus("error", "Connection lost.");
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(`${OPENAI_WEBRTC_URL}?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });
    if (!sdpRes.ok) {
      throw new Error(`Voice connection failed (${sdpRes.status})`);
    }
    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  private handleEvent(raw: string) {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    switch (event.type) {
      // Partner speech transcript (GA and beta event names).
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        this.emitTranscript("partner", event.item_id, event.delta ?? "", false);
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        this.emitTranscript("partner", event.item_id, event.transcript ?? "", true);
        break;
      // Learner speech transcript.
      case "conversation.item.input_audio_transcription.delta":
        this.emitTranscript("you", event.item_id, event.delta ?? "", false);
        break;
      case "conversation.item.input_audio_transcription.completed":
        this.emitTranscript("you", event.item_id, event.transcript ?? "", true);
        break;
      case "error":
        this.callbacks.onStatus("error", event.error?.message ?? "Unknown error");
        break;
    }
  }

  /**
   * Emits one transcript update. Entries share an id per (speaker, item):
   * non-final entries carry a delta chunk to append; a final entry carries
   * the full text and replaces what accumulated.
   */
  private emitTranscript(
    speaker: "you" | "partner",
    itemId: string | undefined,
    text: string,
    final: boolean
  ) {
    this.callbacks.onTranscript({
      id: `${speaker}:${itemId ?? "unknown"}`,
      speaker,
      text,
      final,
    });
  }

  /** Ask the partner for help with a phrase, staying in the app's lifeline flow. */
  lifeline(stuckOn?: string) {
    const text = stuckOn
      ? `(Lifeline: I'm stuck — how do I say "${stuckOn}" in Tagalog? Teach me the phrase, have me repeat it, then continue the scene.)`
      : "(Lifeline: I'm stuck on what to say next. Briefly break character, give me a useful Tagalog phrase for this moment with a quick pronunciation hint, ask me to say it back, then continue the scene.)";
    this.sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    this.sendEvent({ type: "response.create" });
  }

  setMuted(muted: boolean) {
    this.mic?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  private sendEvent(event: object) {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify(event));
    }
  }

  disconnect() {
    this.dc?.close();
    this.pc?.close();
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audioEl) this.audioEl.srcObject = null;
    this.dc = null;
    this.pc = null;
    this.mic = null;
    this.audioEl = null;
  }
}
