import Anthropic from "@anthropic-ai/sdk";
import { SCHEDA_SCHEMA, VERIFICA_SCHEMA } from "./schemas.js";
import { SISTEMA_BASE, istruzioniScheda, istruzioniRipasso, istruzioniVerifica } from "./prompt.js";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CLAUDE_EFFORT || "medium";

let client;
const getClient = () => (client ??= new Anthropic());

export class RifiutoError extends Error {}

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
  return JSON.parse(testo);
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
  const esito = await chiamaJSON({
    system: SISTEMA_BASE,
    content: [...input.immagini.map(immagineBlock), { type: "text", text: istruzioniVerifica(input) }],
    schema: VERIFICA_SCHEMA,
    maxTokens: 16000,
  });
  // Doppia garanzia lato server: niente soluzione senza tentativo serio.
  if (!esito.tentativo_serio) esito.soluzione_guidata = "";
  return esito;
}
