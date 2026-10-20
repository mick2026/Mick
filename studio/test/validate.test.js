import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../server/validate.js";

test("valori sconosciuti ricadono sui default", () => {
  const c = V.contestoBase({ materia: "__proto__", livello: "x", lingua: "zz" });
  assert.deepEqual(c, { materia: "altro", livello: "media2", lingua: "it" });
});

test("il ripasso invia solo campi di contenuto, non umore o date", () => {
  const r = V.ripasso({ schede: [{ titolo: "T", abstract: "A", sessioni: [{ inizio: "poca" }], creata: "2026-01-01", esiti: { 0: {} } }] });
  assert.deepEqual(Object.keys(r.schede[0]).sort(), ["abstract", "concetti_chiave", "domande", "schema", "titolo"]);
});

test("segnala un test con un numero di domande diverso da 10", () => {
  const s = V.controllaScheda({ vero_falso: [{}, {}], avvisi: [] });
  assert.equal(s.avvisi.length, 1);
});
