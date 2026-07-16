/**
 * Shared chat-completions plumbing for the API routes that call the
 * feedback/prep model with a strict JSON schema response. Both
 * app/api/feedback/route.ts and app/api/lia-prep/route.ts build their own
 * request validation, prompts, and schemas, then hand off the actual fetch
 * + parse to this helper.
 */
import { API_BASE_URL, authHeaders } from "./openai-server";

export async function chatJson(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schemaName: string;
  schema: object;
}): Promise<{ ok: true; data: unknown } | { ok: false; status: number }> {
  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      ...authHeaders(opts.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
      },
    }),
  });

  if (!res.ok) {
    console.error(opts.schemaName + " request failed:", res.status, await res.text());
    return { ok: false, status: res.status };
  }

  const data = await res.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, status: 502 };
  }
}
