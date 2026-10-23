import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as attesa } from "node:timers/promises";
import http from "node:http";

const PORT = 18787;
const BASE = `http://127.0.0.1:${PORT}`;
const IMG = { mediaType: "image/jpeg", data: Buffer.from("finta").toString("base64") };
let srv;

// Finto server Brevo: raccoglie le email che il server prova a mandare.
const emailInviate = [];
const fintoBrevo = http.createServer((req, res) => {
  let corpo = "";
  req.on("data", (c) => (corpo += c));
  req.on("end", () => {
    emailInviate.push({ chiave: req.headers["api-key"], ...JSON.parse(corpo) });
    res.writeHead(201, { "Content-Type": "application/json" }).end('{"messageId":"x"}');
  });
});

before(async () => {
  await new Promise((ok) => fintoBrevo.listen(18790, "127.0.0.1", ok));
  srv = spawn(process.execPath, ["server/index.js"], {
    env: { ...process.env, DEMO: "1", AUTH: "dev", STORE: "memoria", PORT: String(PORT), LIMITE_PROVA: "2", NODE_ENV: "test", ADMIN_EMAILS: "admin@prova.it", TRUST_PROXY: "1",
      BREVO_API_KEY: "chiave-test", BREVO_API_URL: "http://127.0.0.1:18790/email", EMAIL_MITTENTE: "noreply@prova.it", APP_URL: "https://app.prova.it" },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${BASE}/api/config`); return; } catch { await attesa(100); }
  }
});
after(() => {
  srv.kill();
  fintoBrevo.close();
});

// Ogni chiamata da un IP diverso (dietro proxy), così i limiti anti-abuso per IP non scattano tra un test e l'altro.
let ip = 0;
const chiama = async (metodo, p, body, token) => {
  const r = await fetch(BASE + p, {
    method: metodo,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      "X-Forwarded-For": `10.0.0.${++ip % 250}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, dati: await r.json().catch(() => null) };
};

async function accedi(email) {
  const { dati } = await chiama("POST", "/api/auth/codice", { email });
  const s = await chiama("POST", "/api/auth/verifica", { email, codice: dati.codiceDiProva });
  assert.equal(s.status, 200);
  return s.dati.access_token;
}

let tokenAdmin;
async function admin() {
  tokenAdmin ??= await accedi("admin@prova.it");
  await chiama("GET", "/api/io", null, tokenAdmin);
  return tokenAdmin;
}

async function approva(email, stato = "approvata") {
  const t = await admin();
  const { dati } = await chiama("GET", "/api/admin/famiglie", null, t);
  const f = dati.famiglie.find((x) => x.email === email);
  assert.ok(f, "famiglia in elenco: " + email);
  assert.equal((await chiama("PATCH", `/api/admin/famiglie/${f.id}`, { stato }, t)).status, 200);
  return f;
}

async function famigliaPronta(email) {
  const token = await accedi(email);
  await chiama("POST", "/api/consenso", { genitore: true }, token);
  await approva(email.toLowerCase());
  const p = await chiama("POST", "/api/profili", { nome: "Tommaso", livello: "media2", lingua: "it" }, token);
  return { token, profilo: p.dati.id };
}

test("serve la pagina con intestazioni di sicurezza", async () => {
  const r = await fetch(BASE + "/");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
});

test("blocca il path traversal", async () => {
  for (const p of ["/..%2fpackage.json", "/%2e%2e/server/index.js", "/../package.json"]) {
    assert.notEqual((await fetch(BASE + p)).status, 200, p);
  }
});

test("senza login le API private rispondono 401", async () => {
  assert.equal((await chiama("GET", "/api/io")).status, 401);
  assert.equal((await chiama("POST", "/api/scheda", { profilo: crypto.randomUUID(), immagini: [IMG] })).status, 401);
  assert.equal((await chiama("GET", "/api/io", null, "token-finto")).status, 401);
});

test("codice sbagliato rifiutato", async () => {
  await chiama("POST", "/api/auth/codice", { email: "a@prova.it" });
  assert.equal((await chiama("POST", "/api/auth/verifica", { email: "a@prova.it", codice: "000000" })).status, 401);
});

test("serve il consenso del genitore prima di creare profili e schede", async () => {
  const token = await accedi("consenso@prova.it");
  const r = await chiama("POST", "/api/profili", { nome: "Ada" }, token);
  assert.equal(r.status, 403);
  assert.equal(r.dati.codice, "consenso");
  assert.equal((await chiama("POST", "/api/consenso", { genitore: true }, token)).status, 200);
  await approva("consenso@prova.it");
  assert.equal((await chiama("POST", "/api/profili", { nome: "Ada" }, token)).status, 200);
});

test("scheda: 10 vero/falso, esercizi senza soluzione, salvata sul server", async () => {
  const { token, profilo } = await famigliaPronta("scheda@prova.it");
  const r = await chiama("POST", "/api/scheda", { profilo, materia: "scienze", energia: "poca", immagini: [IMG] }, token);
  assert.equal(r.status, 200);
  assert.equal(r.dati.vero_falso.length, 10);
  for (const e of r.dati.esercizi) assert.deepEqual(Object.keys(e).sort(), ["consegna", "difficolta", "suggerimento"]);
  const elenco = await chiama("GET", `/api/schede?profilo=${profilo}`, null, token);
  assert.equal(elenco.dati.length, 1);
  assert.equal(elenco.dati[0].riepilogo.inizio, "poca");
});

test("le famiglie non vedono né modificano i dati delle altre", async () => {
  const a = await famigliaPronta("a1@prova.it");
  const b = await famigliaPronta("b1@prova.it");
  const s = (await chiama("POST", "/api/scheda", { profilo: a.profilo, materia: "storia", immagini: [IMG] }, a.token)).dati;
  assert.equal((await chiama("GET", `/api/schede/${s.id}`, null, b.token)).status, 404);
  assert.equal((await chiama("PATCH", `/api/schede/${s.id}`, { test: [] }, b.token)).status, 404);
  assert.equal((await chiama("GET", `/api/schede?profilo=${a.profilo}`, null, b.token)).dati.length, 0);
  assert.equal((await chiama("POST", "/api/scheda", { profilo: a.profilo, immagini: [IMG] }, b.token)).status, 404);
  assert.equal((await chiama("POST", "/api/verifica-tentativo", { scheda: s.id, esercizio: 0, immagini: [IMG] }, b.token)).status, 404);
  await chiama("DELETE", `/api/schede/${s.id}`, {}, b.token);
  assert.equal((await chiama("GET", `/api/schede/${s.id}`, null, a.token)).status, 200);
});

test("il telefono non può scrivere esiti o soluzioni; il server sì dopo il tentativo", async () => {
  const { token, profilo } = await famigliaPronta("esiti@prova.it");
  const s = (await chiama("POST", "/api/scheda", { profilo, materia: "matematica", immagini: [IMG] }, token)).dati;
  const p = await chiama("PATCH", `/api/schede/${s.id}`, { esiti: { 0: { soluzione_guidata: "x" } }, test: [{ ok: 7, tot: 10 }] }, token);
  assert.deepEqual(p.dati.esiti, {});
  assert.equal(p.dati.test[0].ok, 7);
  const v = await chiama("POST", "/api/verifica-tentativo", { scheda: s.id, esercizio: 0, immagini: [IMG] }, token);
  assert.equal(v.status, 200);
  assert.ok(v.dati.esiti[0].soluzione_guidata);
});

test("limite mensile di schede (prova = 2)", async () => {
  const { token, profilo } = await famigliaPronta("limite@prova.it");
  for (let i = 0; i < 2; i++) assert.equal((await chiama("POST", "/api/scheda", { profilo, immagini: [IMG] }, token)).status, 200);
  const r = await chiama("POST", "/api/scheda", { profilo, immagini: [IMG] }, token);
  assert.equal(r.status, 402);
  assert.equal(r.dati.codice, "limite");
  const io = await chiama("GET", "/api/io", null, token);
  assert.equal(io.dati.utilizzo.schede, 2);
  assert.equal(io.dati.utilizzo.limiteSchede, 2);
});

test("esportazione ed eliminazione dell'account", async () => {
  const { token, profilo } = await famigliaPronta("elimina@prova.it");
  await chiama("POST", "/api/scheda", { profilo, immagini: [IMG] }, token);
  const e = await chiama("GET", "/api/esporta", null, token);
  assert.equal(e.dati.schede.length, 1);
  assert.equal((await chiama("DELETE", "/api/account", { conferma: "no" }, token)).status, 400);
  assert.equal((await chiama("DELETE", "/api/account", { conferma: "ELIMINA" }, token)).status, 200);
  assert.equal((await chiama("GET", "/api/io", null, token)).status, 401);
});

test("rifiuta input non validi", async () => {
  const { token, profilo } = await famigliaPronta("input@prova.it");
  assert.equal((await chiama("POST", "/api/scheda", { profilo, immagini: [] }, token)).status, 400);
  assert.equal((await chiama("POST", "/api/scheda", { profilo, immagini: [{ mediaType: "text/html", data: "AAAA" }] }, token)).status, 400);
  assert.equal((await chiama("POST", "/api/profili", { nome: "   " }, token)).status, 400);
  assert.equal((await chiama("GET", "/api/schede/non-un-uuid", null, token)).status, 400);
  assert.equal((await chiama("POST", "/api/auth/codice", { email: "non-email" })).status, 400);
});

test("in produzione non parte con login finto o senza chiavi", async () => {
  const p = spawn(process.execPath, ["server/index.js"], { env: { ...process.env, NODE_ENV: "production", PORT: "18788", ANTHROPIC_API_KEY: "" } });
  let err = "";
  p.stderr.on("data", (d) => (err += d));
  const codice = await new Promise((ok) => p.on("exit", ok));
  assert.equal(codice, 1);
  assert.match(err, /AUTH=supabase/);
  assert.match(err, /ANTHROPIC_API_KEY/);
});

test("area amministrazione: solo per ADMIN_EMAILS, senza nomi dei ragazzi; il piano alza il limite", async () => {
  const fam = await famigliaPronta("iscritto@prova.it");
  assert.equal((await chiama("GET", "/api/admin/famiglie", null, fam.token)).status, 403);
  assert.equal((await chiama("GET", "/api/io", null, fam.token)).dati.admin, false);

  const admin = await famigliaPronta("Admin@Prova.it");
  assert.equal((await chiama("GET", "/api/io", null, admin.token)).dati.admin, true);
  const elenco = await chiama("GET", "/api/admin/famiglie", null, admin.token);
  assert.equal(elenco.status, 200);
  const riga = elenco.dati.famiglie.find((f) => f.email === "iscritto@prova.it");
  assert.ok(riga);
  assert.equal(riga.profili, 1);
  assert.ok(!JSON.stringify(elenco.dati).includes("Tommaso"), "niente nomi dei profili");

  assert.equal((await chiama("PATCH", `/api/admin/famiglie/${riga.id}`, { piano: "vip" }, admin.token)).status, 400);
  assert.equal((await chiama("PATCH", `/api/admin/famiglie/${riga.id}`, { piano: "abbonato" }, fam.token)).status, 403);
  const p = await chiama("PATCH", `/api/admin/famiglie/${riga.id}`, { piano: "abbonato", abbonamento_scade: "2099-12-31" }, admin.token);
  assert.equal(p.status, 200);
  assert.equal((await chiama("GET", "/api/io", null, fam.token)).dati.utilizzo.limiteSchede, 40);
});

test("approvazione: chi si iscrive aspetta, l'amministratore approva o sospende", async () => {
  const token = await accedi("nuovo@prova.it");
  assert.equal((await chiama("POST", "/api/consenso", { genitore: true }, token)).status, 200);
  const io = await chiama("GET", "/api/io", null, token);
  assert.equal(io.dati.famiglia.stato, "in_attesa");
  const bloccata = await chiama("POST", "/api/profili", { nome: "Leo" }, token);
  assert.equal(bloccata.status, 403);
  assert.equal(bloccata.dati.codice, "approvazione");
  assert.ok((await chiama("GET", "/api/io", null, await admin())).dati.inAttesa >= 1);

  await approva("nuovo@prova.it");
  assert.equal((await chiama("POST", "/api/profili", { nome: "Leo" }, token)).status, 200);

  await approva("nuovo@prova.it", "sospesa");
  const sospesa = await chiama("GET", "/api/schede?profilo=" + crypto.randomUUID(), null, token);
  assert.equal(sospesa.status, 403);
  assert.equal(sospesa.dati.errore, "Accesso sospeso.");
  assert.equal((await chiama("PATCH", "/api/admin/famiglie/" + io.dati.famiglia.id, { stato: "boh" }, await admin())).status, 400);
});

test("registro dei costi: ogni scheda e controllo finisce nel riepilogo del mese", async () => {
  const t = await admin();
  const prima = (await chiama("GET", "/api/admin/famiglie", null, t)).dati.costi;
  const { token, profilo } = await famigliaPronta("costi@prova.it");
  const s = (await chiama("POST", "/api/scheda", { profilo, immagini: [IMG, IMG] }, token)).dati;
  await chiama("POST", "/api/verifica-tentativo", { scheda: s.id, esercizio: 0, immagini: [IMG] }, token);
  const dopo = (await chiama("GET", "/api/admin/famiglie", null, t)).dati;
  assert.equal(dopo.costi.richieste, prima.richieste + 2);
  assert.equal(dopo.costi.perTipo.scheda.immaginiMedie > 0, true);
  assert.ok(dopo.costi.perTipo.verifica.n >= 1);
  assert.ok("costoMese" in dopo.famiglie.find((f) => f.email === "costi@prova.it"));
});

test("email: avviso all'amministratore alla nuova iscrizione e conferma all'iscritto quando è approvato", async () => {
  const email = "avviso@prova.it";
  const trova = async (filtro) => {
    for (let i = 0; i < 30; i++) {
      const e = emailInviate.find(filtro);
      if (e) return e;
      await attesa(50);
    }
    return null;
  };
  const token = await accedi(email);
  await chiama("POST", "/api/consenso", { genitore: true }, token);
  const avviso = await trova((e) => e.subject === "Nuova iscrizione da approvare" && e.htmlContent.includes(email));
  assert.ok(avviso, "avviso inviato");
  assert.deepEqual(avviso.to, [{ email: "admin@prova.it" }]);
  assert.equal(avviso.chiave, "chiave-test");
  assert.equal(avviso.sender.email, "noreply@prova.it");
  assert.ok(avviso.htmlContent.includes("https://app.prova.it/#/admin"));

  // Un secondo consenso non manda un altro avviso.
  await chiama("POST", "/api/consenso", { genitore: true }, token);
  await attesa(200);
  assert.equal(emailInviate.filter((e) => e.htmlContent.includes(email) && e.subject.startsWith("Nuova")).length, 1);

  await approva(email);
  const conferma = await trova((e) => e.to?.[0]?.email === email && e.subject.includes("attivo"));
  assert.ok(conferma, "conferma all'iscritto");
});
