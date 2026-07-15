/**
 * Server-side provider config: talks to Azure AI Foundry when
 * AZURE_OPENAI_ENDPOINT is set, otherwise to the OpenAI API directly.
 *
 * On Azure, the GA v1 surface mirrors OpenAI's paths under
 * `<endpoint>/openai/v1`, auth uses an `api-key` header instead of a
 * Bearer token, and `model` fields take your *deployment name*.
 */
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "");

export const API_BASE_URL = azureEndpoint
  ? `${azureEndpoint}/openai/v1`
  : "https://api.openai.com/v1";

/** URL the browser posts its WebRTC SDP offer to. */
export const WEBRTC_CALLS_URL = `${API_BASE_URL}/realtime/calls`;

export function authHeaders(apiKey: string): Record<string, string> {
  return azureEndpoint
    ? { "api-key": apiKey }
    : { Authorization: `Bearer ${apiKey}` };
}

/** Accepts either env name; FOUNDRY_API_KEY pairs with AZURE_OPENAI_ENDPOINT. */
export function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.FOUNDRY_API_KEY;
}
