import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import * as V from "./validate.js";
import { generaScheda, generaRipasso, verificaTentativo, RifiutoError } from "./claude.js";
import { schedaDemo, verificaDemo } from "./demo.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// Impostazioni facoltative dal file .env (vedi .env.example).
try {
  process.loadEnvFile(path.resolve(here, "../.env"));
} catch {}
const PUBLIC = path.resolve(here, "../public");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const DEMO = process.env.DEMO === "1" || process.argv.includes("--demo");
const ACCESS_CODE = process.env.APP_ACCESS_CODE || "";
const MAX_BODY = 30 * 1024 * 1024;

if (!DEMO && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.warn("Attenzione: ANTHROPIC_API_KEY non impostata. Usa DEMO=1 per provare senza chiave.");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

// Limite semplice di richieste per IP (in memoria): 20 generazioni ogni 10 minuti.
const finestre = new Map();
function limiteSuperato(ip) {
  const ora = Date.now();
  const f = (finestre.get(ip) ?? []).filter((t) => ora - t < 10 * 60_000);
  f.push(ora);
  finestre.set(ip, f);
  return f.length > 20;
}

function invia(res, status, body, headers = {}) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    ...(isJson ? { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } : {}),
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

async function leggiJSON(req) {
  if (!(req.headers["content-type"] ?? "").startsWith("application/json")) throw new V.InputError("Content-Type non valido.");
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new V.InputError("Richiesta troppo grande.");
    chunks.push(c);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new V.InputError("JSON non valido.");
  }
}

function codiceValido(req) {
  if (!ACCESS_CODE) return true;
  const dato = Buffer.from(String(req.headers["x-access-code"] ?? ""));
  const atteso = Buffer.from(ACCESS_CODE);
  return dato.length === atteso.length && crypto.timingSafeEqual(dato, atteso);
}

const API = {
  "/api/scheda": async (b) => {
    const input = V.scheda(b);
    return V.controllaScheda(DEMO ? schedaDemo() : await generaScheda(input));
  },
  "/api/ripasso": async (b) => {
    const input = V.ripasso(b);
    return V.controllaScheda(DEMO ? schedaDemo("Ripasso (demo)") : await generaRipasso(input));
  },
  "/api/verifica-tentativo": async (b) => {
    const input = V.verifica(b);
    return DEMO ? verificaDemo() : await verificaTentativo(input);
  },
};

async function gestisciApi(req, res, url) {
  if (url.pathname === "/api/config") return invia(res, 200, { demo: DEMO, richiedeCodice: Boolean(ACCESS_CODE) });
  const handler = API[url.pathname];
  if (!handler) return invia(res, 404, { errore: "Non trovato." });
  if (req.method !== "POST") return invia(res, 405, { errore: "Metodo non consentito." });
  if (!codiceValido(req)) return invia(res, 401, { errore: "Codice di accesso non valido." });
  if (limiteSuperato(req.socket.remoteAddress ?? "?")) return invia(res, 429, { errore: "Troppe richieste: fai una pausa e riprova tra qualche minuto." });

  try {
    return invia(res, 200, await handler(await leggiJSON(req)));
  } catch (err) {
    if (err instanceof V.InputError) return invia(res, 400, { errore: err.message });
    if (err instanceof RifiutoError) return invia(res, 422, { errore: "Non posso elaborare questo materiale. Prova con altre pagine." });
    if (err instanceof Anthropic.RateLimitError) return invia(res, 429, { errore: "Servizio occupato, riprova tra poco." });
    if (err instanceof Anthropic.AuthenticationError) return invia(res, 500, { errore: "Chiave API non valida sul server." });
    if (err instanceof Anthropic.APIError) return invia(res, 502, { errore: "Errore del servizio AI, riprova." });
    // Nessun contenuto dello studente nei log: solo il tipo di errore.
    console.error(`[${url.pathname}]`, err?.name, err?.message);
    return invia(res, 500, { errore: err?.message?.startsWith("Risposta troppo lunga") ? err.message : "Errore interno." });
  }
}

async function servStatico(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") return invia(res, 405, "Metodo non consentito");
  const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.resolve(PUBLIC, "." + rel);
  if (!file.startsWith(PUBLIC + path.sep)) return invia(res, 403, "Vietato");
  try {
    const data = await fs.readFile(file);
    invia(res, 200, data, {
      "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
  } catch {
    invia(res, 404, "Non trovato");
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    (url.pathname.startsWith("/api/") ? gestisciApi : servStatico)(req, res, url).catch(() => invia(res, 500, { errore: "Errore interno." }));
  })
  .listen(PORT, HOST, () => {
    console.log(`Studio Amico pronto${DEMO ? " (DEMO)" : ""}: sul computer apri http://localhost:${PORT}`);
    if (HOST === "0.0.0.0") {
      const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i?.family === "IPv4" && !i.internal);
      for (const i of ips) console.log(`Dal telefono (stessa Wi-Fi) apri http://${i.address}:${PORT}`);
    }
  });
