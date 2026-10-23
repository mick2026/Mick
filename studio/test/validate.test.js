import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../server/validate.js";
import { contenutoPerRipasso, istruzioniScheda } from "../server/prompt.js";
import { materieProposte, SCUOLE } from "../public/scuole.js";

test("il profilo tiene solo un soprannome pulito e valori ammessi", () => {
  const p = V.profilo({ nome: "  <b>Tommaso</b>\u0007 ", livello: "__proto__", lingua: "zz" });
  assert.deepEqual(p, { nome: "bTommaso/b", livello: "media2", lingua: "it", scuola: null, materie: [] });
});

test("il ripasso invia solo campi di contenuto, non umore o date", () => {
  const r = contenutoPerRipasso({ titolo: "T", abstract: "A", sessioni: [{ inizio: "poca" }], creata: "2026-01-01", esiti: { 0: {} } });
  assert.deepEqual(Object.keys(r).sort(), ["abstract", "concetti_chiave", "domande", "schema", "titolo"]);
});

test("dal telefono si aggiornano solo sessioni e test, con valori limitati", () => {
  const a = V.aggiornaScheda({ sessioni: [{ inizio: "tanta", fine: "boh" }], test: [{ ok: 99, tot: 10 }], esiti: { 0: {} } });
  assert.deepEqual(Object.keys(a).sort(), ["sessioni", "test"]);
  assert.equal(a.sessioni[0].fine, null);
  assert.equal(a.test[0].ok, 10);
});

test("segnala un test con un numero di domande diverso da 10", () => {
  const s = V.controllaScheda({ vero_falso: [{}, {}], avvisi: [] });
  assert.equal(s.avvisi.length, 1);
});

test("materie proposte per scuola e classe", () => {
  const terza = materieProposte("liceo_scientifico", "sup3").map((m) => m.nome);
  assert.ok(terza.includes("Filosofia"));
  assert.ok(terza.includes("Storia"));
  assert.ok(!terza.includes("Storia e geografia"));
  const prima = materieProposte("liceo_scientifico", "sup1").map((m) => m.nome);
  assert.ok(prima.includes("Storia e geografia") && !prima.includes("Filosofia"));
  assert.ok(materieProposte("liceo_classico", "sup2").some((m) => m.nome === "Lingua e cultura greca"));
  assert.deepEqual(materieProposte("inesistente", "sup1"), []);
  for (const [k, sc] of Object.entries(SCUOLE)) {
    for (const l of sc.livelli) assert.ok(materieProposte(k, l).length >= 5, `${k} ${l}`);
    for (const x of sc.materie) assert.ok(x.area, `${k}: ${x.nome} senza area`);
  }
});

test("materie libere: pulite, uniche, area valida", () => {
  const m = V.materie([
    { nome: " Laboratorio <b>di</b> chimica ", emoji: "🧪🧪🧪", area: "scienze" },
    { nome: "Laboratorio di chimica", area: "inventata" },
    { nome: "   " },
  ]);
  assert.equal(m.length, 2);
  assert.equal(m[0].nome, "Laboratorio bdi/b chimica");
  assert.equal(m[0].emoji, "🧪🧪");
  assert.notEqual(m[0].id, m[1].id);
  assert.equal(m[1].area, "altro");
  assert.throws(() => V.materie(new Array(41).fill({ nome: "x" })));
});

test("Claude riceve il nome esatto della materia e la scuola", () => {
  const t = istruzioniScheda({ materia: "latino_greco", materiaNome: "Lingua e cultura greca", scuolaNome: "Liceo classico", livello: "sup3", lingua: "it", energia: "media" });
  assert.match(t, /MATERIA: Lingua e cultura greca \(area: Latino \/ Greco\)/);
  assert.match(t, /SCUOLA: Liceo classico/);
});
