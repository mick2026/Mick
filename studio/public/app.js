import { t, lang, setLang, LINGUE_UI, applicaTraduzioni } from "./i18n.js";
import * as db from "./db.js";
import { preparaImmagine } from "./img.js";
import { esportaHTML, scarica } from "./export.js";
import {
  ELENCO_MATERIE, UMORE_INIZIO, UMORE_FINE, emojiMateria, esc, dataBreve,
  renderScheda, attivaBase, etichetteBase,
} from "./render.js";

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");
let config = { demo: false, richiedeCodice: false };

// ---------- utilità ----------
const LIVELLI = ["primaria", "media1", "media2", "media3", "sup1", "sup2", "sup3", "sup4", "sup5"];
const LINGUE_SCHEDE = ["it", "en", "es", "fr", "de"];

function impostazioni() {
  return {
    livello: db.pref("livello") ?? "media2",
    linguaSchede: db.pref("linguaSchede") ?? lang(),
    codice: db.pref("codice") ?? "",
  };
}

async function api(percorso, body) {
  const r = await fetch(percorso, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Access-Code": impostazioni().codice },
    body: JSON.stringify(body),
  });
  const dati = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dati.errore || t("erroreGenerico"));
  return dati;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("visibile");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visibile"), 3500);
}

// crypto.randomUUID esiste solo in HTTPS: su rete locale in http si usa getRandomValues.
const nuovoId = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");

function caricamento(chiavi) {
  let i = 0;
  app.innerHTML = `<div class="caricamento" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div><p id="msg-car">${t(chiavi[0])}</p></div>`;
  const timer = setInterval(() => {
    const p = $("#msg-car");
    if (!p) return clearInterval(timer);
    p.textContent = t(chiavi[++i % chiavi.length]);
  }, 2800);
  return () => clearInterval(timer);
}

const MSG_CARICAMENTO = ["car1", "car2", "car3", "car4", "car5"];

// ---------- consenso iniziale ----------
function vistaBenvenuto() {
  app.innerHTML = `<section class="pannello">
    <h1>👋 ${t("benvenuto")}</h1>
    <p>${t("benvenutoTesto")}</p>
    <ul class="privacy-lista">
      <li>🔒 ${t("priv1")}</li><li>🤖 ${t("priv2")}</li><li>🙈 ${t("priv3")}</li><li>🗑️ ${t("priv4")}</li>
    </ul>
    <label class="check"><input type="checkbox" id="consenso"> ${t("consensoGenitore")}</label>
    <button class="btn btn-pri" id="inizia" disabled>${t("iniziamo")}</button>
    <p class="nota"><a href="#/privacy">${t("leggiPrivacy")}</a></p>
  </section>`;
  $("#consenso").onchange = (e) => ($("#inizia").disabled = !e.target.checked);
  $("#inizia").onclick = () => {
    db.pref("consenso", new Date().toISOString());
    location.hash = "#/nuova";
  };
}

function vistaPrivacy() {
  app.innerHTML = `<section class="pannello testo">
    <h1>🔒 ${t("privacyTitolo")}</h1>
    ${t("privacyTesto")}
    <p><a href="#/">${t("indietro")}</a></p>
  </section>`;
}

// ---------- nuova scheda ----------
const bozza = { energia: null, materia: null, immagini: [], note: "" };

function vistaNuova() {
  const passo = !bozza.energia ? 1 : !bozza.materia ? 2 : 3;
  if (passo === 1) {
    app.innerHTML = `<section class="pannello centro">
      <h1>${t("quantaVoglia")}</h1>
      <div class="umore">${UMORE_INIZIO.map(([k, e]) => `<button class="btn-umore" data-energia="${k}"><span>${e}</span>${t("energia_" + k)}</button>`).join("")}</div>
      <p class="nota">${t("notaUmore")}</p>
    </section>`;
    app.onclick = (ev) => {
      const b = ev.target.closest("[data-energia]");
      if (!b) return;
      bozza.energia = b.dataset.energia;
      toast(t("energiaRisposta_" + bozza.energia));
      vistaNuova();
    };
    return;
  }
  if (passo === 2) {
    app.innerHTML = `<section class="pannello">
      <h1>${t("sceltaMateria")}</h1>
      <div class="materie">${ELENCO_MATERIE.map(([k, e]) => `<button class="chip" data-materia="${k}"><span>${e}</span> ${t("materia_" + k)}</button>`).join("")}</div>
      <button class="link" id="indietro">← ${t("indietro")}</button>
    </section>`;
    app.onclick = (ev) => {
      if (ev.target.id === "indietro") return (bozza.energia = null), vistaNuova();
      const b = ev.target.closest("[data-materia]");
      if (b) (bozza.materia = b.dataset.materia), vistaNuova();
    };
    return;
  }
  app.innerHTML = `<section class="pannello">
    <p class="meta">${emojiMateria(bozza.materia)} ${t("materia_" + bozza.materia)} · <button class="link" id="cambia">${t("cambia")}</button></p>
    <h1>${t("fotografa")}</h1>
    <p>${t("fotografaTesto")}</p>
    <div class="foto-azioni">
      <label class="btn btn-pri">📷 ${t("scatta")}<input type="file" accept="image/*" capture="environment" multiple hidden id="in-camera"></label>
      <label class="btn btn-sec">🖼️ ${t("galleria")}<input type="file" accept="image/*" multiple hidden id="in-galleria"></label>
    </div>
    <div class="anteprime">${bozza.immagini.map((img, i) => `<figure><img src="${img.anteprima}" alt="${t("pagina")} ${i + 1}"><button class="x" data-rimuovi="${i}" aria-label="${t("rimuovi")}">×</button></figure>`).join("")}</div>
    <p class="nota">${t("contaFoto").replace("{n}", bozza.immagini.length).replace("{max}", 8)} · ${t("avvisoFoto")}</p>
    <label class="campo">${t("noteFacoltative")}<textarea id="note" rows="2" maxlength="500" placeholder="${t("notePlaceholder")}">${esc(bozza.note)}</textarea></label>
    <button class="btn btn-pri grande" id="genera" ${bozza.immagini.length ? "" : "disabled"}>✨ ${t("creaScheda")}</button>
  </section>`;

  const aggiungi = async (files) => {
    for (const f of files) {
      if (bozza.immagini.length >= 8) {
        toast(t("maxFoto"));
        break;
      }
      try {
        bozza.immagini.push(await preparaImmagine(f));
      } catch {
        toast(t("fotoNonLeggibile"));
      }
    }
    vistaNuova();
  };
  $("#in-camera").onchange = (e) => aggiungi(e.target.files);
  $("#in-galleria").onchange = (e) => aggiungi(e.target.files);
  $("#note").oninput = (e) => (bozza.note = e.target.value);
  app.onclick = (ev) => {
    if (ev.target.id === "cambia") return (bozza.materia = null), vistaNuova();
    const r = ev.target.closest("[data-rimuovi]");
    if (r) return bozza.immagini.splice(Number(r.dataset.rimuovi), 1), vistaNuova();
    if (ev.target.closest("#genera")) generaScheda();
  };
}

async function generaScheda() {
  const imp = impostazioni();
  const stop = caricamento(MSG_CARICAMENTO);
  try {
    const out = await api("/api/scheda", {
      materia: bozza.materia,
      livello: imp.livello,
      lingua: imp.linguaSchede,
      energia: bozza.energia,
      note: bozza.note,
      immagini: bozza.immagini.map(({ mediaType, data }) => ({ mediaType, data })),
    });
    const ora = new Date().toISOString();
    const scheda = {
      ...out,
      id: nuovoId(),
      tipo: "scheda",
      materia: bozza.materia,
      lingua: imp.linguaSchede,
      creata: ora,
      sessioni: [{ data: ora, inizio: bozza.energia, fine: null }],
      esiti: {},
      test: [],
    };
    await db.salva(scheda);
    Object.assign(bozza, { energia: null, materia: null, immagini: [], note: "" });
    location.hash = `#/scheda/${scheda.id}`;
  } catch (e) {
    toast(e.message);
    vistaNuova();
  } finally {
    stop();
  }
}

// ---------- scheda ----------
async function vistaScheda(id) {
  const s = await db.leggi(id);
  if (!s) return (location.hash = "#/archivio");
  const sessione = s.sessioni.at(-1);
  const sessioneAperta = sessione && !sessione.fine && Date.now() - new Date(sessione.data) < 6 * 3600_000;

  app.innerHTML = `
    <div class="barra-azioni no-print">
      <a class="link" href="#/archivio">← ${t("archivio")}</a>
      <span class="spazio-flex"></span>
      <button class="btn btn-sec" id="stampa">🖨️ ${t("stampa")}</button>
      <button class="btn btn-sec" id="esporta">📤 ${t("esporta")}</button>
      <button class="btn btn-ghost" id="elimina" aria-label="${t("elimina")}">🗑️</button>
    </div>
    ${sessioneAperta ? "" : `<div class="banner no-print" id="banner-inizio"><span>${t("quantaVoglia")}</span>
      ${UMORE_INIZIO.map(([k, e]) => `<button class="btn-umore mini" data-inizio="${k}" title="${t("energia_" + k)}">${e}</button>`).join("")}</div>`}
    <nav class="indice no-print" aria-label="${t("sezioni")}">
      ${["abstract", "schema", "concetti", "esercizi", "domande", "vf", "vita", "piano"].map((k) => `<a href="#sez-${k}" data-salta="${k}">${t("nav_" + k)}</a>`).join("")}
    </nav>
    <main class="wrap-scheda">${renderScheda(s, "app")}</main>
    <section class="pannello centro no-print" id="fine">
      <h2>${t("comeEAndata")}</h2>
      <div class="umore">${UMORE_FINE.map(([k, e]) => `<button class="btn-umore ${sessione?.fine === k && sessioneAperta ? "scelto" : ""}" data-fine="${k}"><span>${e}</span>${t("fine_" + k)}</button>`).join("")}</div>
    </section>`;

  attivaBase(app, s.vero_falso ?? [], etichetteBase(), async (ok, tot) => {
    s.test.push({ data: new Date().toISOString(), ok, tot });
    await db.salva(s);
  });

  app.onclick = async (ev) => {
    const salto = ev.target.closest("[data-salta]");
    if (salto) {
      ev.preventDefault();
      document.getElementById("sez-" + salto.dataset.salta)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const ini = ev.target.closest("[data-inizio]");
    if (ini) {
      s.sessioni.push({ data: new Date().toISOString(), inizio: ini.dataset.inizio, fine: null });
      await db.salva(s);
      $("#banner-inizio").remove();
      return toast(t("energiaRisposta_" + ini.dataset.inizio));
    }
    const fine = ev.target.closest("[data-fine]");
    if (fine) {
      const ultima = s.sessioni.at(-1);
      if (!ultima || Date.now() - new Date(ultima.data) > 6 * 3600_000) {
        s.sessioni.push({ data: new Date().toISOString(), inizio: null, fine: null });
      }
      s.sessioni.at(-1).fine = fine.dataset.fine;
      await db.salva(s);
      app.querySelectorAll("[data-fine]").forEach((b) => b.classList.toggle("scelto", b === fine));
      return toast(t("fineRisposta_" + fine.dataset.fine));
    }
    if (ev.target.closest("#stampa")) return window.print();
    if (ev.target.closest("#esporta")) return esportaHTML(s).catch(() => toast(t("erroreGenerico")));
    if (ev.target.closest("#elimina") && confirm(t("confermaElimina"))) {
      await db.elimina(s.id);
      location.hash = "#/archivio";
    }
  };

  app.onchange = async (ev) => {
    const input = ev.target.closest("[data-tentativo]");
    if (!input?.files.length) return;
    const i = Number(input.dataset.tentativo);
    const box = input.closest(".esercizio");
    box.insertAdjacentHTML("beforeend", `<p class="nota attesa" role="status">⏳ ${t("controlloTentativo")}</p>`);
    try {
      const immagini = [];
      for (const f of [...input.files].slice(0, 4)) {
        const { mediaType, data } = await preparaImmagine(f);
        immagini.push({ mediaType, data });
      }
      const imp = impostazioni();
      const esito = await api("/api/verifica-tentativo", {
        materia: s.materia,
        livello: imp.livello,
        lingua: s.lingua,
        esercizio: { consegna: s.esercizi[i].consegna },
        contestoScheda: `${s.titolo}. ${s.abstract}`,
        immagini,
      });
      // Si salva solo l'esito testuale, non la foto del tentativo.
      s.esiti[i] = { ...esito, data: new Date().toISOString() };
      await db.salva(s);
      toast(esito.tentativo_serio ? t("tentativoOk") : t("tentativoNo"));
      vistaScheda(id).then(() => document.getElementById("sez-esercizi")?.scrollIntoView());
    } catch (e) {
      toast(e.message);
      box.querySelector(".attesa")?.remove();
    }
  };
}

// ---------- archivio ----------
async function vistaArchivio() {
  const schede = await db.tutte();
  const filtro = db.pref("filtroMateria") ?? "";
  const visibili = filtro ? schede.filter((s) => s.materia === filtro) : schede;
  const gruppi = Map.groupBy ? Map.groupBy(visibili, (s) => s.materia) : raggruppa(visibili);
  const presenti = [...new Set(schede.map((s) => s.materia))];

  app.innerHTML = `<section class="pannello">
    <h1>🗂️ ${t("archivio")}</h1>
    ${schede.length ? `<label class="campo">${t("filtraMateria")}
      <select id="filtro"><option value="">${t("tutte")}</option>${presenti.map((m) => `<option value="${m}" ${m === filtro ? "selected" : ""}>${t("materia_" + m)}</option>`).join("")}</select></label>` : `<p>${t("archivioVuoto")}</p><a class="btn btn-pri" href="#/nuova">✨ ${t("creaPrima")}</a>`}
    ${[...gruppi].map(([m, lista]) => `<h2>${emojiMateria(m)} ${t("materia_" + m)} <small>(${lista.length})</small></h2>
      <ul class="elenco">${lista.map(voceArchivio).join("")}</ul>`).join("")}
  </section>`;
  const sel = $("#filtro");
  if (sel) sel.onchange = (e) => (db.pref("filtroMateria", e.target.value), vistaArchivio());
  app.onclick = null;
}

function raggruppa(lista) {
  const m = new Map();
  for (const s of lista) m.set(s.materia, [...(m.get(s.materia) ?? []), s]);
  return m;
}

function voceArchivio(s) {
  const ultima = s.sessioni?.at(-1);
  const umore = [UMORE_INIZIO.find(([k]) => k === ultima?.inizio)?.[1], UMORE_FINE.find(([k]) => k === ultima?.fine)?.[1]]
    .filter(Boolean).join(" → ");
  const test = s.test?.at(-1);
  return `<li><a href="#/scheda/${s.id}">
    <span class="titolo">${s.tipo === "ripasso" ? "🔁 " : ""}${esc(s.titolo)}</span>
    <span class="meta">${esc(dataBreve(s.creata))}${umore ? " · " + umore : ""}${test ? ` · ✅ ${test.ok}/${test.tot}` : ""}</span>
  </a></li>`;
}

// ---------- ripasso ----------
async function vistaRipasso() {
  const schede = (await db.tutte()).filter((s) => s.tipo === "scheda");
  const presenti = [...new Set(schede.map((s) => s.materia))];
  const materia = presenti.includes(db.pref("materiaRipasso")) ? db.pref("materiaRipasso") : presenti[0];
  if (!materia) {
    app.innerHTML = `<section class="pannello"><h1>🔁 ${t("ripasso")}</h1><p>${t("ripassoVuoto")}</p></section>`;
    return;
  }
  const dellaMateria = schede.filter((s) => s.materia === materia);
  app.innerHTML = `<section class="pannello">
    <h1>🔁 ${t("ripasso")}</h1>
    <p>${t("ripassoTesto")}</p>
    <label class="campo">${t("materia")}
      <select id="mat-rip">${presenti.map((m) => `<option value="${m}" ${m === materia ? "selected" : ""}>${t("materia_" + m)}</option>`).join("")}</select></label>
    <fieldset><legend>${t("qualiSchede")}</legend>
      <ul class="elenco check">${dellaMateria.map((s) => `<li><label><input type="checkbox" value="${s.id}" checked> ${esc(s.titolo)} <span class="meta">${esc(dataBreve(s.creata))}</span></label></li>`).join("")}</ul>
    </fieldset>
    <fieldset><legend>${t("perCosa")}</legend>
      <div class="modi">${["riassunto", "orale", "scritto"].map((m, i) => `<label class="chip"><input type="radio" name="modo" value="${m}" ${i === 0 ? "checked" : ""}> ${t("modo_" + m)}</label>`).join("")}</div>
    </fieldset>
    <button class="btn btn-pri grande" id="crea-ripasso">✨ ${t("creaRipasso")}</button>
  </section>`;
  $("#mat-rip").onchange = (e) => (db.pref("materiaRipasso", e.target.value), vistaRipasso());
  app.onclick = async (ev) => {
    if (!ev.target.closest("#crea-ripasso")) return;
    const ids = [...app.querySelectorAll(".elenco input:checked")].map((i) => i.value);
    if (!ids.length) return toast(t("selezionaAlmenoUna"));
    const modalita = app.querySelector("input[name=modo]:checked").value;
    const scelte = dellaMateria.filter((s) => ids.includes(s.id));
    const imp = impostazioni();
    const stop = caricamento(MSG_CARICAMENTO);
    try {
      const out = await api("/api/ripasso", { materia, livello: imp.livello, lingua: imp.linguaSchede, modalita, schede: scelte });
      const ora = new Date().toISOString();
      const r = { ...out, id: nuovoId(), tipo: "ripasso", modalita, fonti: ids, materia, lingua: imp.linguaSchede, creata: ora, sessioni: [], esiti: {}, test: [] };
      await db.salva(r);
      location.hash = `#/scheda/${r.id}`;
    } catch (e) {
      toast(e.message);
      vistaRipasso();
    } finally {
      stop();
    }
  };
}

// ---------- impostazioni ----------
function vistaImpostazioni() {
  const imp = impostazioni();
  app.innerHTML = `<section class="pannello">
    <h1>⚙️ ${t("impostazioni")}</h1>
    <label class="campo">${t("linguaApp")}
      <select id="lingua-app">${Object.entries(LINGUE_UI).map(([k, n]) => `<option value="${k}" ${k === lang() ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label class="campo">${t("linguaSchede")}
      <select id="lingua-schede">${LINGUE_SCHEDE.map((k) => `<option value="${k}" ${k === imp.linguaSchede ? "selected" : ""}>${t("lingua_" + k)}</option>`).join("")}</select></label>
    <label class="campo">${t("classe")}
      <select id="livello">${LIVELLI.map((k) => `<option value="${k}" ${k === imp.livello ? "selected" : ""}>${t("livello_" + k)}</option>`).join("")}</select></label>
    ${config.richiedeCodice ? `<label class="campo">${t("codiceAccesso")}<input id="codice" type="password" autocomplete="off" value="${esc(imp.codice)}"></label>` : ""}
    <h2>💾 ${t("datiTitolo")}</h2>
    <p class="nota">${t("datiTesto")}</p>
    <div class="foto-azioni">
      <button class="btn btn-sec" id="backup">⬇️ ${t("backup")}</button>
      <label class="btn btn-sec">⬆️ ${t("ripristina")}<input type="file" accept="application/json" hidden id="ripristina"></label>
      <button class="btn btn-ghost pericolo" id="cancella">🗑️ ${t("cancellaTutto")}</button>
    </div>
    <p><a href="#/privacy">${t("leggiPrivacy")}</a></p>
  </section>`;
  $("#lingua-app").onchange = (e) => (setLang(e.target.value), applicaTraduzioni(), vistaImpostazioni());
  $("#lingua-schede").onchange = (e) => db.pref("linguaSchede", e.target.value);
  $("#livello").onchange = (e) => db.pref("livello", e.target.value);
  if ($("#codice")) $("#codice").onchange = (e) => db.pref("codice", e.target.value);
  $("#backup").onclick = async () => {
    const dati = { app: "studio-amico", versione: 1, esportato: new Date().toISOString(), schede: await db.tutte() };
    scarica(new Blob([JSON.stringify(dati)], { type: "application/json" }), `studio-amico-backup-${dati.esportato.slice(0, 10)}.json`);
  };
  $("#ripristina").onchange = async (e) => {
    try {
      const dati = JSON.parse(await e.target.files[0].text());
      if (dati.app !== "studio-amico" || !Array.isArray(dati.schede)) throw new Error();
      let n = 0;
      for (const s of dati.schede) {
        if (typeof s?.id === "string" && typeof s.creata === "string" && typeof s.titolo === "string") {
          await db.salva(s);
          n++;
        }
      }
      toast(t("ripristinate").replace("{n}", n));
    } catch {
      toast(t("fileNonValido"));
    }
  };
  $("#cancella").onclick = async () => {
    if (!confirm(t("confermaCancellaTutto"))) return;
    await db.svuota();
    db.cancellaPref();
    location.hash = "#/";
    location.reload();
  };
  app.onclick = null;
}

// ---------- router ----------
async function router() {
  app.onclick = app.onchange = null;
  window.scrollTo(0, 0);
  const [, vista, id] = location.hash.split("/");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("attivo", a.dataset.nav === (vista || "nuova")));
  if (vista === "privacy") return vistaPrivacy();
  if (!db.pref("consenso")) return vistaBenvenuto();
  switch (vista) {
    case "scheda": return vistaScheda(decodeURIComponent(id ?? ""));
    case "archivio": return vistaArchivio();
    case "ripasso": return vistaRipasso();
    case "impostazioni": return vistaImpostazioni();
    default: return vistaNuova();
  }
}

(async () => {
  applicaTraduzioni();
  try {
    config = await (await fetch("/api/config")).json();
  } catch {}
  if (config.demo) $("#demo-badge").hidden = false;
  window.addEventListener("hashchange", router);
  router();
})();
