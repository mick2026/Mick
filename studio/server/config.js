import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// Impostazioni facoltative dal file .env (vedi .env.example).
try {
  process.loadEnvFile(path.resolve(here, "../.env"));
} catch {}

const env = process.env;
const numero = (v, def) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : def);
const haSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);

export const CONFIG = {
  porta: numero(env.PORT, 8787),
  host: env.HOST || "127.0.0.1",
  produzione: env.NODE_ENV === "production",
  demo: env.DEMO === "1" || process.argv.includes("--demo"),
  // "supabase" in produzione; "dev" = login finto per provare in locale.
  auth: env.AUTH || (haSupabase ? "supabase" : "dev"),
  // "supabase" in produzione; "memoria" = dati in RAM (o in un file JSON con STORE_FILE).
  store: env.STORE || (haSupabase ? "supabase" : "memoria"),
  storeFile: env.STORE_FILE || "",
  supabase: {
    url: env.SUPABASE_URL || "",
    chiavePubblica: env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "",
    chiaveSegreta: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  // Dietro un proxy (Render, Fly) l'IP del cliente arriva in X-Forwarded-For.
  fidatiProxy: env.TRUST_PROXY === "1",
  limiti: {
    prova: { schede: numero(env.LIMITE_PROVA, 5) },
    abbonato: { schede: numero(env.LIMITE_ABBONATO, 40) },
    verifichePerScheda: numero(env.VERIFICHE_PER_SCHEDA, 3),
    profiliPerFamiglia: 6,
  },
  versioneConsenso: "2026-10",
  // Email (separate da virgola) che vedono l'area Amministrazione.
  admin: (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
};

export function verificaConfig() {
  const errori = [];
  if (CONFIG.produzione) {
    if (CONFIG.auth !== "supabase") errori.push("In produzione serve AUTH=supabase (il login finto è solo per prove).");
    if (CONFIG.store !== "supabase") errori.push("In produzione serve STORE=supabase.");
    if (CONFIG.demo) errori.push("DEMO=1 non è ammesso in produzione.");
    if (!process.env.ANTHROPIC_API_KEY) errori.push("Manca ANTHROPIC_API_KEY.");
  }
  if ((CONFIG.auth === "supabase" || CONFIG.store === "supabase") && !haSupabase) {
    errori.push("Mancano SUPABASE_URL e SUPABASE_SECRET_KEY.");
  }
  if (CONFIG.auth === "supabase" && !CONFIG.supabase.chiavePubblica) errori.push("Manca SUPABASE_PUBLISHABLE_KEY.");
  if (errori.length) throw new Error("Configurazione non valida:\n- " + errori.join("\n- "));
}

export function limiteSchede(famiglia) {
  const attivo = famiglia.piano === "abbonato" && (!famiglia.abbonamento_scade || new Date(famiglia.abbonamento_scade) > new Date());
  return attivo ? CONFIG.limiti.abbonato.schede : CONFIG.limiti.prova.schede;
}

export const meseCorrente = () => new Date().toISOString().slice(0, 7);
