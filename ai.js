// ============================================================
// SHRED — AI WRAPPER  (provider-agnostic, bring-your-own-key)
// Supports: Groq, Google Gemini, and any OpenAI-compatible endpoint.
// The key is stored ONLY in localStorage on the user's own device.
// ============================================================

export const PROVIDERS = {
  groq: {
    label: "Groq",
    hint: "Fastest. Free key at console.groq.com/keys",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b"],
    keyUrl: "https://console.groq.com/keys",
    kind: "openai",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  gemini: {
    label: "Google Gemini",
    hint: "Most daily volume. Free key at aistudio.google.com/apikey",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"],
    keyUrl: "https://aistudio.google.com/apikey",
    kind: "gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
  },
  openai_compat: {
    label: "OpenAI-compatible",
    hint: "Any base URL that speaks the OpenAI chat format (OpenRouter, Together, local, etc.)",
    defaultModel: "",
    models: [],
    keyUrl: "",
    kind: "openai",
    endpoint: "", // user supplies baseURL
  },
};

// settings shape: { provider, apiKey, model, baseURL }
export function loadAISettings() {
  try { return JSON.parse(localStorage.getItem("sp_ai_settings")) || null; } catch { return null; }
}
export function saveAISettings(s) {
  localStorage.setItem("sp_ai_settings", JSON.stringify(s));
}
export function clearAISettings() {
  localStorage.removeItem("sp_ai_settings");
}

// Core call. Takes a system prompt + array of {role, content}. Returns text.
export async function aiChat({ system, messages, settings }) {
  const prov = PROVIDERS[settings.provider];
  if (!prov) throw new Error("Unknown provider");
  if (!settings.apiKey) throw new Error("No API key set. Open Settings → AI to add one.");

  if (prov.kind === "gemini") return geminiCall({ system, messages, settings, prov });
  return openaiCall({ system, messages, settings, prov });
}

// ── OpenAI-compatible (Groq, OpenRouter, Together, local) ────
async function openaiCall({ system, messages, settings, prov }) {
  const endpoint = settings.baseURL
    ? settings.baseURL.replace(/\/$/, "") + "/chat/completions"
    : prov.endpoint;

  const body = {
    model: settings.model || prov.defaultModel,
    temperature: 0.6,
    max_tokens: 1024,
    messages: [{ role: "system", content: system }, ...messages],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(parseProviderError(res.status, t));
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from provider.");
  return text;
}

// ── Google Gemini ────────────────────────────────────────────
async function geminiCall({ system, messages, settings, prov }) {
  const model = settings.model || prov.defaultModel;
  const url = `${prov.endpoint}/${model}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;

  // Gemini wants role "user"/"model" and a separate systemInstruction
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(parseProviderError(res.status, t));
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  if (!text) throw new Error("Empty response from Gemini.");
  return text;
}

// Friendly error messages
function parseProviderError(status, raw) {
  let detail = "";
  try { const j = JSON.parse(raw); detail = j.error?.message || j.message || ""; } catch { detail = raw.slice(0, 140); }
  if (status === 401 || status === 403) return `Invalid or unauthorized API key. ${detail}`;
  if (status === 429) return `Rate limit reached for your free tier. Wait a minute and try again.`;
  if (status === 404) return `Model not found — check the model name in Settings. ${detail}`;
  return `Provider error ${status}: ${detail}`;
}

// Quick connectivity test used by Settings "Test key" button
export async function testKey(settings) {
  const text = await aiChat({
    system: "You are a connectivity test. Reply with exactly: OK",
    messages: [{ role: "user", content: "ping" }],
    settings,
  });
  return /ok/i.test(text);
}
