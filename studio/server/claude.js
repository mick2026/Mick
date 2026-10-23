import Anthropic from "@anthropic-ai/sdk";
import { SCHEDA_SCHEMA, VERIFICA_SCHEMA } from "./schemas.js";
import { SISTEMA_BASE, istruzioniScheda, istruzioniRipasso, istruzioniVerifica } from "./prompt.js";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CLAUDE_EFFORT || "medium";

let client;
const getClient = () => (client ??= new Anthropic());

export class RifiutoError extends Error {}

// Prezzi in dollari per milione di token: [ingresso, uscita, lettura dalla cache]. Fonte: listino Anthropic.
const PREZZI = {
  "claude-opus-5-5": [4, 20, 0.2],
  "claude-opus-5": [5, 25, 0.5],
  "claude-opus-4-8": [5, 25, 0.5],
  "claude-sonnet-5-5": [2, 10, 0.2],
  "claude-haiku-5-5": [0.1, 0.5, 0.01],
  "claude-fable-5-1": [10, 50, 0.25],
};

// Quanto è costata una chiamata: solo numeri, nessun contenuto.
export function consumoDi(msg) {
  const u = msg.usage ?? {};
  const [pin, pout, pcache] = PREZZI[msg.model] ?? PREZZI[MODEL] ?? PREZZI["claude-opus-5-5"];
  const tokenIn = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const tokenCache = u.cache_read_input_tokens ?? 0;
  const tokenOut = u.output_tokens ?? 0;
  const costo = ((u.input_tokens ?? 0) * pin + (u.cache_creation_input_tokens ?? 0) * pin * 1.25 + tokenCache * pcache + tokenOut * pout) / 1e6;
  return { modello: msg.model ?? MODEL, token_in: tokenIn, token_out: tokenOut, token_cache: tokenCache, costo_usd: Math.round(costo * 1e6) / 1e6 };
}

async function chiamaJSON({ system, content, schema, maxTokens = 32000 }) {
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new RifiutoError("Richiesta rifiutata per motivi di sicurezza.");
  if (msg.stop_reason === "max_tokens") throw new Error("Risposta troppo lunga: prova con meno pagine.");
  const testo = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { dati: JSON.parse(testo), consumo: consumoDi(msg) };
}

const immagineBlock = (img) => ({
  type: "image",
  source: { type: "base64", media_type: img.mediaType, data: img.data },
});

export function generaScheda(input) {
  return chiamaJSON({
    system: SISTEMA_BASE,
    content: [...input.immagini.map(immagineBlock), { type: "text", text: istruzioniScheda(input) }],
    schema: SCHEDA_SCHEMA,
  });
}

export function generaRipasso(input) {
  return chiamaJSON({ system: SISTEMA_BASE, content: [{ type: "text", text: istruzioniRipasso(input) }], schema: SCHEDA_SCHEMA });
}

export async function verificaTentativo(input) {
  const { dati: esito, consumo } = await chiamaJSON({
    system: SISTEMA_BASE,
    content: [...input.immagini.map(immagineBlock), { type: "text", text: istruzioniVerifica(input) }],
    schema: VERIFICA_SCHEMA,
    maxTokens: 16000,
  });
  // Doppia garanzia lato server: niente soluzione senza tentativo serio.
  if (!esito.tentativo_serio) esito.soluzione_guidata = "";
  return { dati: esito, consumo };
}
