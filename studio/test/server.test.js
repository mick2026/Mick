import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as attesa } from "node:timers/promises";

const PORT = 18787;
const BASE = `http://127.0.0.1:${PORT}`;
const IMG = { mediaType: "image/jpeg", data: Buffer.from("finta").toString("base64") };
let srv;

before(async () => {
  srv = spawn(process.execPath, ["server/index.js"], { env: { ...process.env, DEMO: "1", PORT: String(PORT) }, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${BASE}/api/config`); return; } catch { await attesa(100); }
  }
});
after(() => srv.kill());

const post = (p, body) =>
  fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("serve la pagina con intestazioni di sicurezza", async () => {
  const r = await fetch(BASE + "/");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});

test("blocca il path traversal", async () => {
  for (const p of ["/..%2fpackage.json", "/%2e%2e/server/index.js", "/../package.json"]) {
    const r = await fetch(BASE + p);
    assert.notEqual(r.status, 200, p);
  }
});

test("genera una scheda (demo) con 10 vero/falso e senza soluzioni negli esercizi", async () => {
  const r = await post("/api/scheda", { materia: "scienze", immagini: [IMG] });
  assert.equal(r.status, 200);
  const s = await r.json();
  assert.equal(s.vero_falso.length, 10);
  for (const e of s.esercizi) assert.deepEqual(Object.keys(e).sort(), ["consegna", "difficolta", "suggerimento"]);
});

test("rifiuta input non validi", async () => {
  assert.equal((await post("/api/scheda", { materia: "scienze", immagini: [] })).status, 400);
  assert.equal((await post("/api/scheda", { immagini: [{ mediaType: "text/html", data: "AAAA" }] })).status, 400);
  assert.equal((await post("/api/verifica-tentativo", { esercizio: { consegna: "x" } })).status, 400);
  const r = await fetch(BASE + "/api/scheda", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" });
  assert.equal(r.status, 400);
});
