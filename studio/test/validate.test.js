import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../server/validate.js";
import { contenutoPerRipasso } from "../server/prompt.js";

test("il profilo tiene solo un soprannome pulito e valori ammessi", () => {
  const p = V.profilo({ nome: "  <b>Tommaso</b>\u0007 ", livello: "__proto__", lingua: "zz" });
  assert.deepEqual(p, { nome: "bTommaso/b", livello: "media2", lingua: "it" });
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
