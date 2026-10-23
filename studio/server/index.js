import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { CONFIG, verificaConfig, limiteSchede, meseCorrente } from "./config.js";
import * as V from "./validate.js";
import { creaAuthSupabase, creaAuthDev, AuthError } from "./auth.js";
import { creaStoreMemoria } from "./store/memoria.js";
import { creaStoreSupabase } from "./store/supabase.js";
import { generaScheda, generaRipasso, verificaTentativo, RifiutoError } from "./claude.js";
import { contenutoPerRipasso } from "./prompt.js";
import { schedaDemo, verificaDemo } from "./demo.js";

try {
  verificaConfig();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(here, "../public");
const MAX_BODY = 30 * 1024 * 1024;

const auth = CONFIG.auth === "supabase" ? creaAuthSupabase(CONFIG.supabase) : creaAuthDev();
const store = CONFIG.store === "supabase" ? creaStoreSupabase(CONFIG.supabase) : creaStoreMemoria(CONFIG.storeFile);

if (!CONFIG.demo && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
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
  ...(CONFIG.produzione ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
};

class HttpError extends Error {
  constructor(status, messaggio, codice) {
    super(messaggio);
    Object.assign(this, { status, codice });
  }
}

// Limiti di frequenza in memoria: chiave -> istanti delle richieste.
const finestre = new Map();
function limita(chiave, max, finestraMs) {
  const ora = Date.now();
  const f = (finestre.get(chiave) ?? []).filter((t) => ora - t < finestraMs);
  f.push(ora);
  finestre.set(chiave, f);
  if (finestre.size > 50_000) finestre.clear();
  if (f.length > max) throw new HttpError(429, "Troppe richieste: fai una pausa e riprova tra qualche minuto.");
}

function ipDi(req) {
  if (CONFIG.fidatiProxy) {
    const xff = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    if (xff) return xff;
  }
  return req.socket.remoteAddress ?? "?";
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
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new V.InputError("JSON non valido.");
  }
}

// ---------- schede: dalla riga del database a ciò che vede il telefono ----------
function riepilogo(dati) {
  const s = dati.sessioni?.at(-1);
  const t = dati.test?.at(-1);
  return { inizio: s?.inizio ?? null, fine: s?.fine ?? null, test: t ? { ok: t.ok, tot: t.tot } : null };
}
const perClient = (riga) => ({ ...riga.dati, id: riga.id, profilo_id: riga.profilo_id, materia: riga.materia, tipo: riga.tipo, creata: riga.creata });
const voceElenco = ({ id, profilo_id, materia, tipo, titolo, creata, riepilogo }) => ({ id, profilo_id, materia, tipo, titolo, creata, riepilogo });

async function profiloDellaFamiglia(fid, pid) {
  const p = (await store.profili(fid)).find((x) => x.id === pid);
  if (!p) throw new HttpError(404, "Profilo non trovato.");
  return p;
}

async function stato(utente) {
  let famiglia = await store.famiglia(utente.id, utente.email);
  if (eAdmin(utente) && famiglia.stato !== "approvata") famiglia = await store.aggiornaFamiglia(utente.id, { stato: "approvata" });
  const [profili, uso] = await Promise.all([store.profili(utente.id), store.utilizzo(utente.id, meseCorrente())]);
  const limite = limiteSchede(famiglia);
  return {
    famiglia,
    profili,
    utilizzo: { ...uso, limiteSchede: limite, limiteVerifiche: limite * CONFIG.limiti.verifichePerScheda },
  };
}

const CONSUMO_DEMO = { modello: "demo", token_in: 0, token_out: 0, token_cache: 0, costo_usd: 0 };

// Scala una quota prima di chiamare Claude e la restituisce se la generazione fallisce.
// Il lavoro restituisce { dati, consumo }: il consumo (solo numeri) finisce nel registro dei costi.
async function conQuota(fid, tipo, limite, registro, lavoro) {
  const mese = meseCorrente();
  if (!(await store.consuma(fid, mese, tipo, limite))) {
    throw new HttpError(402, tipo === "schede" ? "Hai usato tutte le schede di questo mese." : "Hai usato tutti i controlli dei tentativi di questo mese.", "limite");
  }
  let risultato;
  try {
    risultato = await lavoro();
  } catch (e) {
    await store.consuma(fid, mese, tipo, limite, -1).catch(() => {});
    throw e;
  }
  await store
    .registraConsumo({ famiglia_id: fid, mese, ...registro, ...risultato.consumo })
    .catch((e) => console.error("[consumi] non registrato:", e.message));
  return risultato.dati;
}

// Totali del mese per tipo di richiesta: numero, costo, costo medio, token medi.
function riepilogoCosti(consumi) {
  const perTipo = {};
  let totale = 0;
  for (const c of consumi) {
    const t = (perTipo[c.tipo] ??= { n: 0, costo: 0, tokenIn: 0, tokenOut: 0, immagini: 0 });
    t.n++;
    t.costo += Number(c.costo_usd);
    t.tokenIn += c.token_in;
    t.tokenOut += c.token_out;
    t.immagini += c.immagini;
    totale += Number(c.costo_usd);
  }
  for (const t of Object.values(perTipo)) {
    Object.assign(t, { medio: t.costo / t.n, tokenInMedi: Math.round(t.tokenIn / t.n), tokenOutMedi: Math.round(t.tokenOut / t.n), immaginiMedie: t.immagini / t.n });
  }
  return { totale, richieste: consumi.length, perTipo, modelli: [...new Set(consumi.map((c) => c.modello))] };
}

const eAdmin = (utente) => Boolean(utente.email) && CONFIG.admin.includes(utente.email.toLowerCase());
function soloAdmin(utente) {
  if (!eAdmin(utente)) throw new HttpError(403, "Area riservata all'amministrazione.");
}

// ---------- rotte ----------
const pubbliche = {
  "GET /api/config": async () => ({
    demo: CONFIG.demo,
    loginDiProva: CONFIG.auth === "dev",
    versioneConsenso: CONFIG.versioneConsenso,
  }),
  "GET /api/salute": async () => ({ ok: true }),
  "POST /api/auth/codice": async ({ body, ip }) => {
    const email = V.email(body.email);
    limita("codice-ip:" + ip, 10, 15 * 60_000);
    limita("codice-email:" + email, 5, 15 * 60_000);
    const r = await auth.inviaCodice(email);
    return CONFIG.auth === "dev" ? { inviato: true, codiceDiProva: r.codiceDev } : { inviato: true };
  },
  "POST /api/auth/verifica": async ({ body, ip }) => {
    const email = V.email(body.email);
    limita("verifica-ip:" + ip, 20, 15 * 60_000);
    limita("verifica-email:" + email, 8, 15 * 60_000);
    return auth.verificaCodice(email, V.codice(body.codice));
  },
  "POST /api/auth/rinnova": async ({ body, ip }) => {
    limita("rinnova-ip:" + ip, 60, 15 * 60_000);
    if (typeof body.refresh_token !== "string") throw new V.InputError("Sessione non valida.");
    return auth.rinnova(body.refresh_token);
  },
};

const private_ = {
  "GET /api/io": async ({ utente }) => {
    const s = await stato(utente);
    const admin = eAdmin(utente);
    const inAttesa = admin ? (await store.elencoFamiglie(meseCorrente())).filter((f) => f.stato === "in_attesa").length : 0;
    return { email: utente.email, admin, inAttesa, approvazione: CONFIG.approvazione, ...s };
  },
  "GET /api/admin/famiglie": async ({ utente }) => {
    soloAdmin(utente);
    const mese = meseCorrente();
    const [famiglie, consumi] = await Promise.all([store.elencoFamiglie(mese), store.consumiDelMese(mese)]);
    const costo = new Map();
    for (const c of consumi) costo.set(c.famiglia_id, (costo.get(c.famiglia_id) ?? 0) + Number(c.costo_usd));
    return {
      mese,
      famiglie: famiglie.map((f) => ({ ...f, limiteSchede: limiteSchede(f), costoMese: costo.get(f.id) ?? 0 })),
      costi: riepilogoCosti(consumi),
    };
  },
  "PATCH /api/admin/famiglie/:id": async ({ utente, body, id }) => {
    soloAdmin(utente);
    const campi = body.stato !== undefined ? V.statoFamiglia(body) : V.piano(body);
    const f = await store.aggiornaFamiglia(V.uuid(id), campi);
    if (!f) throw new HttpError(404, "Famiglia non trovata.");
    console.log(`[admin] famiglia ${f.id} aggiornata: ${JSON.stringify(campi)}`);
    return f;
  },
  "POST /api/auth/esci": async ({ token }) => (await auth.esci(token), { ok: true }),
  "POST /api/consenso": async ({ utente, body }) => {
    if (body.genitore !== true) throw new V.InputError("Serve la conferma del genitore o tutore.");
    await store.famiglia(utente.id);
    await store.salvaConsenso(utente.id, CONFIG.versioneConsenso);
    return stato(utente);
  },
  "GET /api/esporta": async ({ utente }) => ({ esportato: new Date().toISOString(), email: utente.email, ...(await store.esporta(utente.id)) }),
  "DELETE /api/account": async ({ utente, body, token }) => {
    if (body.conferma !== "ELIMINA") throw new V.InputError("Scrivi ELIMINA per confermare.");
    await store.eliminaFamiglia(utente.id);
    await auth.eliminaUtente(utente.id);
    await auth.esci(token);
    return { ok: true };
  },
};

// Rotte che richiedono anche il consenso del genitore già registrato.
const conConsenso = {
  "POST /api/profili": async ({ utente, body }) => {
    if ((await store.profili(utente.id)).length >= CONFIG.limiti.profiliPerFamiglia) throw new V.InputError("Hai raggiunto il numero massimo di profili.");
    return store.creaProfilo(utente.id, V.profilo(body));
  },
  "PATCH /api/profili/:id": async ({ utente, body, id }) => {
    const p = await store.aggiornaProfilo(utente.id, V.uuid(id), V.profilo(body, true));
    if (!p) throw new HttpError(404, "Profilo non trovato.");
    return p;
  },
  "DELETE /api/profili/:id": async ({ utente, id }) => (await store.eliminaProfilo(utente.id, V.uuid(id)), { ok: true }),

  "GET /api/schede": async ({ utente, url }) => {
    const pid = V.uuid(url.searchParams.get("profilo"));
    return (await store.elencoSchede(utente.id, pid)).map(voceElenco);
  },
  "GET /api/schede/:id": async ({ utente, id }) => {
    const r = await store.leggiScheda(utente.id, V.uuid(id));
    if (!r) throw new HttpError(404, "Scheda non trovata.");
    return perClient(r);
  },
  "PATCH /api/schede/:id": async ({ utente, body, id }) => {
    const r = await store.leggiScheda(utente.id, V.uuid(id));
    if (!r) throw new HttpError(404, "Scheda non trovata.");
    const dati = { ...r.dati, ...V.aggiornaScheda(body) };
    return perClient(await store.aggiornaScheda(utente.id, r.id, { dati, riepilogo: riepilogo(dati) }));
  },
  "DELETE /api/schede/:id": async ({ utente, id }) => (await store.eliminaScheda(utente.id, V.uuid(id)), { ok: true }),

  "POST /api/scheda": async ({ utente, body, famiglia }) => {
    const input = V.nuovaScheda(body);
    const p = await profiloDellaFamiglia(utente.id, input.profilo);
    const out = await conQuota(utente.id, "schede", limiteSchede(famiglia), { tipo: "scheda", immagini: input.immagini.length }, async () =>
      CONFIG.demo ? { dati: schedaDemo(), consumo: CONSUMO_DEMO } : generaScheda({ ...input, livello: p.livello, lingua: p.lingua }),
    );
    const ora = new Date().toISOString();
    const dati = { ...V.controllaScheda(out), lingua: p.lingua, livello: p.livello, sessioni: [{ data: ora, inizio: input.energia, fine: null }], esiti: {}, test: [] };
    const riga = await store.creaScheda({
      famiglia_id: utente.id, profilo_id: p.id, materia: input.materia, tipo: "scheda", titolo: String(dati.titolo).slice(0, 200), riepilogo: riepilogo(dati), dati,
    });
    return perClient(riga);
  },
  "POST /api/ripasso": async ({ utente, body, famiglia }) => {
    const input = V.ripasso(body);
    const p = await profiloDellaFamiglia(utente.id, input.profilo);
    const righe = (await store.schedePerId(utente.id, input.ids)).filter((r) => r.profilo_id === p.id);
    if (!righe.length) throw new HttpError(404, "Schede non trovate.");
    const materia = righe[0].materia;
    const out = await conQuota(utente.id, "schede", limiteSchede(famiglia), { tipo: "ripasso", immagini: 0 }, async () =>
      CONFIG.demo
        ? { dati: schedaDemo("Ripasso (demo)"), consumo: CONSUMO_DEMO }
        : generaRipasso({ materia, livello: p.livello, lingua: p.lingua, modalita: input.modalita, schede: righe.map((r) => contenutoPerRipasso(r.dati)) }),
    );
    const dati = { ...V.controllaScheda(out), lingua: p.lingua, livello: p.livello, modalita: input.modalita, fonti: righe.map((r) => r.id), sessioni: [], esiti: {}, test: [] };
    const riga = await store.creaScheda({
      famiglia_id: utente.id, profilo_id: p.id, materia, tipo: "ripasso", titolo: String(dati.titolo).slice(0, 200), riepilogo: riepilogo(dati), dati,
    });
    return perClient(riga);
  },
  "POST /api/verifica-tentativo": async ({ utente, body, famiglia }) => {
    const input = V.verifica(body);
    const r = await store.leggiScheda(utente.id, input.scheda);
    const esercizio = r?.dati.esercizi?.[input.esercizio];
    if (!esercizio) throw new HttpError(404, "Esercizio non trovato.");
    const limite = limiteSchede(famiglia) * CONFIG.limiti.verifichePerScheda;
    const esito = await conQuota(utente.id, "verifiche", limite, { tipo: "verifica", immagini: input.immagini.length }, async () =>
      CONFIG.demo
        ? { dati: verificaDemo(), consumo: CONSUMO_DEMO }
        : verificaTentativo({
            materia: r.materia, livello: r.dati.livello, lingua: r.dati.lingua,
            esercizio: { consegna: esercizio.consegna }, contestoScheda: `${r.dati.titolo}. ${r.dati.abstract}`.slice(0, 2000),
            immagini: input.immagini,
          }),
    );
    // Si salva solo il testo dell'esito, mai la foto del tentativo.
    const dati = { ...r.dati, esiti: { ...r.dati.esiti, [input.esercizio]: { ...esito, data: new Date().toISOString() } } };
    return perClient(await store.aggiornaScheda(utente.id, r.id, { dati }));
  },
};

function trova(tabella, metodo, pathname) {
  for (const [chiave, fn] of Object.entries(tabella)) {
    const [m, schema] = chiave.split(" ");
    if (m !== metodo) continue;
    const a = schema.split("/");
    const b = pathname.split("/");
    if (a.length !== b.length) continue;
    let id;
    if (a.every((seg, i) => (seg === ":id" ? ((id = decodeURIComponent(b[i])), true) : seg === b[i]))) return { fn, id };
  }
  return null;
}

async function gestisciApi(req, res, url) {
  const ip = ipDi(req);
  try {
    const ctx = { url, ip };
    const pub = trova(pubbliche, req.method, url.pathname);
    const libera = pub ? null : trova(private_, req.method, url.pathname);
    const vincolata = pub || libera ? null : trova(conConsenso, req.method, url.pathname);
    const r = pub ?? libera ?? vincolata;
    if (!r) throw new HttpError(404, "Non trovato.");
    ctx.id = r.id;
    ctx.body = req.method === "GET" ? {} : await leggiJSON(req);

    if (!pub) {
      const token = (String(req.headers.authorization ?? "").match(/^Bearer (.+)$/) ?? [])[1];
      ctx.utente = token ? await auth.utente(token) : null;
      if (!ctx.utente) throw new HttpError(401, "Accedi di nuovo.", "sessione");
      ctx.token = token;
    }
    if (vincolata) {
      ctx.famiglia = await store.famiglia(ctx.utente.id);
      if (!ctx.famiglia.consenso_at) throw new HttpError(403, "Serve prima il consenso del genitore.", "consenso");
      if (CONFIG.approvazione && ctx.famiglia.stato !== "approvata" && !eAdmin(ctx.utente)) {
        throw new HttpError(403, ctx.famiglia.stato === "sospesa" ? "Accesso sospeso." : "La tua iscrizione è in attesa di approvazione.", "approvazione");
      }
      if (/^\/api\/(scheda|ripasso|verifica-tentativo)$/.test(url.pathname)) {
        limita("ai-utente:" + ctx.utente.id, 20, 10 * 60_000);
        limita("ai-ip:" + ip, 40, 10 * 60_000);
      }
    }
    return invia(res, 200, await r.fn(ctx));
  } catch (err) {
    if (err instanceof HttpError) return invia(res, err.status, { errore: err.message, codice: err.codice });
    if (err instanceof V.InputError) return invia(res, 400, { errore: err.message });
    if (err instanceof AuthError) return invia(res, 401, { errore: err.message, codice: "auth" });
    if (err instanceof RifiutoError) return invia(res, 422, { errore: "Non posso elaborare questo materiale. Prova con altre pagine." });
    if (err instanceof Anthropic.RateLimitError) return invia(res, 429, { errore: "Servizio occupato, riprova tra poco." });
    if (err instanceof Anthropic.AuthenticationError) return invia(res, 500, { errore: "Configurazione del servizio AI non valida." });
    if (err instanceof Anthropic.APIError) return invia(res, 502, { errore: "Errore del servizio AI, riprova." });
    // Nessun contenuto dello studente nei log: solo il tipo di errore.
    console.error(`[${req.method} ${url.pathname}]`, err?.name, err?.message);
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
    invia(res, 200, data, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  } catch {
    invia(res, 404, "Non trovato");
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    (url.pathname.startsWith("/api/") ? gestisciApi : servStatico)(req, res, url).catch(() => invia(res, 500, { errore: "Errore interno." }));
  })
  .listen(CONFIG.porta, CONFIG.host, () => {
    const modo = [CONFIG.demo && "DEMO", CONFIG.auth === "dev" && "login di prova", CONFIG.store === "memoria" && "dati in memoria"].filter(Boolean);
    console.log(`Studio Amico pronto${modo.length ? ` (${modo.join(", ")})` : ""}: sul computer apri http://localhost:${CONFIG.porta}`);
    if (CONFIG.host === "0.0.0.0" && !CONFIG.produzione) {
      const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i?.family === "IPv4" && !i.internal);
      for (const i of ips) console.log(`Dal telefono (stessa Wi-Fi) apri http://${i.address}:${CONFIG.porta}`);
    }
  });
