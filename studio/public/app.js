import { t, lang, setLang, LINGUE_UI, applicaTraduzioni } from "./i18n.js";
import { pref, cancellaPref } from "./db.js";
import { preparaImmagine } from "./img.js";
import { esportaHTML, scarica } from "./export.js";
import {
  ELENCO_MATERIE, UMORE_INIZIO, UMORE_FINE, emojiMateria, esc, dataBreve,
  renderScheda, attivaBase, etichetteBase,
} from "./render.js";

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");
let config = { demo: false, loginDiProva: false };
let io = null; // { email, famiglia, profili, utilizzo }

const LIVELLI = ["primaria", "media1", "media2", "media3", "sup1", "sup2", "sup3", "sup4", "sup5"];
const LINGUE_SCHEDE = ["it", "en", "es", "fr", "de"];

// ---------- sessione e API ----------
class ErroreApi extends Error {}

async function rinnova(s) {
  const r = await fetch("/api/auth/rinnova", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (!r.ok) throw new ErroreApi("sessione");
  const nuova = await r.json();
  pref("sessione", nuova);
  return nuova;
}

async function api(metodo, percorso, body, riprova = true) {
  let s = pref("sessione");
  if (s && s.expires_at * 1000 < Date.now() + 60_000) s = await rinnova(s).catch(() => null);
  const r = await fetch(percorso, {
    method: metodo,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(s ? { Authorization: "Bearer " + s.access_token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && s && riprova) {
    const nuova = await rinnova(s).catch(() => null);
    if (nuova) return api(metodo, percorso, body, false);
  }
  const dati = await r.json().catch(() => ({}));
  if (r.status === 401 && s) {
    esci(false);
    throw Object.assign(new ErroreApi(t("sessioneScaduta")), { codice: "sessione" });
  }
  if (!r.ok) throw Object.assign(new ErroreApi(dati.errore || t("erroreGenerico")), { codice: dati.codice, status: r.status });
  return dati;
}

async function aggiornaIo() {
  io = await api("GET", "/api/io");
  return io;
}

function esci(chiama = true) {
  const s = pref("sessione");
  if (chiama && s) fetch("/api/auth/esci", { method: "POST", headers: { Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
  pref("sessione", null);
  pref("profilo", null);
  io = null;
  if (location.hash !== "#/") location.hash = "#/";
  else router();
}

const profiloCorrente = () => io?.profili.find((p) => p.id === pref("profilo")) ?? null;

// ---------- utilità ----------
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("visibile");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visibile"), 3500);
}

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

function testoUtilizzo() {
  const u = io.utilizzo;
  const piano = io.famiglia.piano === "abbonato" ? t("pianoAbbonato") : t("pianoProva");
  return `${piano} · ${t("schedeMese").replace("{n}", u.schede).replace("{max}", u.limiteSchede)}`;
}

function aggiornaTestata() {
  const p = profiloCorrente();
  const chip = $("#chip-profilo");
  chip.hidden = !p;
  if (p) chip.textContent = `👤 ${p.nome}`;
}

// ---------- accesso ----------
const login = { email: "", inviato: false, codiceDiProva: "" };

function vistaLogin() {
  app.innerHTML = `<section class="pannello">
    <h1>👋 ${t("benvenuto")}</h1>
    <p>${t("benvenutoTesto")}</p>
    ${login.inviato
      ? `<form id="form-codice" novalidate>
          <p>${t("codiceInviato").replace("{email}", `<strong>${esc(login.email)}</strong>`)}</p>
          ${login.codiceDiProva ? `<p class="nota">${t("codiceDiProva")}: <strong>${esc(login.codiceDiProva)}</strong></p>` : ""}
          <label class="campo" for="codice">${t("codice")}<input id="codice" inputmode="numeric" autocomplete="one-time-code" maxlength="10" value="${esc(login.codiceDiProva)}" required></label>
          <button class="btn btn-pri grande" type="submit">${t("entra")}</button>
          <p><button class="link" type="button" id="cambia-email">${t("cambiaEmail")}</button></p>
        </form>`
      : `<form id="form-email" novalidate>
          <label class="campo" for="email">${t("emailGenitore")}<input id="email" type="email" autocomplete="email" value="${esc(login.email)}" required></label>
          <p class="nota">${t("notaLogin")}</p>
          <button class="btn btn-pri grande" type="submit">${t("mandaCodice")}</button>
        </form>`}
    <p class="nota"><a href="#/privacy">${t("leggiPrivacy")}</a></p>
  </section>`;

  $("#form-email")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    login.email = $("#email").value.trim();
    try {
      const r = await api("POST", "/api/auth/codice", { email: login.email });
      Object.assign(login, { inviato: true, codiceDiProva: r.codiceDiProva ?? "" });
      vistaLogin();
      $("#codice").focus();
    } catch (err) {
      toast(err.message);
    }
  });
  $("#form-codice")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const s = await api("POST", "/api/auth/verifica", { email: login.email, codice: $("#codice").value });
      pref("sessione", s);
      Object.assign(login, { inviato: false, codiceDiProva: "" });
      router();
    } catch (err) {
      toast(err.message);
    }
  });
  $("#cambia-email")?.addEventListener("click", () => ((login.inviato = false), vistaLogin()));
}

function vistaConsenso() {
  app.innerHTML = `<section class="pannello">
    <h1>👨‍👩‍👧 ${t("consensoTitolo")}</h1>
    <p>${t("consensoTesto")}</p>
    <ul class="privacy-lista">
      <li>🔒 ${t("priv1")}</li><li>🤖 ${t("priv2")}</li><li>🙈 ${t("priv3")}</li><li>🗑️ ${t("priv4")}</li>
    </ul>
    <label class="check"><input type="checkbox" id="c-genitore"> <span>${t("consensoGenitoreAdulto")}</span></label>
    <label class="check"><input type="checkbox" id="c-privacy"> <span>${t("consensoPrivacy")} (<a href="#/privacy">${t("leggiPrivacy")}</a>)</span></label>
    <button class="btn btn-pri" id="conferma-consenso" disabled>${t("iniziamo")}</button>
    <p><button class="link" id="esci">${t("esci")}</button></p>
  </section>`;
  const aggiorna = () => ($("#conferma-consenso").disabled = !($("#c-genitore").checked && $("#c-privacy").checked));
  $("#c-genitore").onchange = $("#c-privacy").onchange = aggiorna;
  $("#esci").onclick = () => esci();
  $("#conferma-consenso").onclick = async () => {
    try {
      Object.assign(io, await api("POST", "/api/consenso", { genitore: true }));
      router();
    } catch (err) {
      toast(err.message);
    }
  };
}

// ---------- profili ----------
function campiProfilo(p = {}) {
  return `<label class="campo" for="p-nome">${t("nomeProfilo")}<input id="p-nome" maxlength="40" autocomplete="off" value="${esc(p.nome ?? "")}" placeholder="${t("nomeProfiloEsempio")}"></label>
    <p class="nota">${t("notaNomeProfilo")}</p>
    <label class="campo" for="p-livello">${t("classe")}
      <select id="p-livello">${LIVELLI.map((k) => `<option value="${k}" ${k === (p.livello ?? "media2") ? "selected" : ""}>${t("livello_" + k)}</option>`).join("")}</select></label>
    <label class="campo" for="p-lingua">${t("linguaSchede")}
      <select id="p-lingua">${LINGUE_SCHEDE.map((k) => `<option value="${k}" ${k === (p.lingua ?? lang()) ? "selected" : ""}>${t("lingua_" + k)}</option>`).join("")}</select></label>`;
}
const leggiCampiProfilo = () => ({ nome: $("#p-nome").value, livello: $("#p-livello").value, lingua: $("#p-lingua").value });

function vistaProfili() {
  const nuovo = !io.profili.length;
  app.innerHTML = nuovo
    ? `<section class="pannello">
        <h1>${t("primoProfilo")}</h1>
        ${campiProfilo()}
        <button class="btn btn-pri grande" id="crea-profilo">${t("creaProfilo")}</button>
      </section>`
    : `<section class="pannello centro">
        <h1>${t("chiStudia")}</h1>
        <div class="profili">${io.profili.map((p) => `<button class="btn-profilo" data-profilo="${p.id}"><span aria-hidden="true">🧑‍🎓</span>${esc(p.nome)}<small>${t("livello_" + p.livello)}</small></button>`).join("")}</div>
        <details class="aggiungi"><summary>＋ ${t("aggiungiProfilo")}</summary>
          <div class="sinistra">${campiProfilo()}<button class="btn btn-pri" id="crea-profilo">${t("creaProfilo")}</button></div>
        </details>
      </section>`;
  app.onclick = async (ev) => {
    const b = ev.target.closest("[data-profilo]");
    if (b) {
      pref("profilo", b.dataset.profilo);
      aggiornaTestata();
      return (location.hash = "#/nuova");
    }
    if (ev.target.closest("#crea-profilo")) {
      try {
        const p = await api("POST", "/api/profili", leggiCampiProfilo());
        io.profili.push(p);
        pref("profilo", p.id);
        aggiornaTestata();
        if (location.hash === "#/nuova") router();
        else location.hash = "#/nuova";
      } catch (err) {
        toast(err.message);
      }
    }
  };
}

// ---------- nuova scheda ----------
const bozza = { energia: null, materia: null, immagini: [], note: "" };

function vistaNuova() {
  if (io.utilizzo.schede >= io.utilizzo.limiteSchede) {
    app.innerHTML = `<section class="pannello centro">
      <h1>🌙 ${t("limiteTitolo")}</h1>
      <p>${t("limiteTesto")}</p>
      <p class="nota">${testoUtilizzo()}</p>
      <a class="btn btn-sec" href="#/archivio">${t("vaiArchivio")}</a>
    </section>`;
    return;
  }
  const passo = !bozza.energia ? 1 : !bozza.materia ? 2 : 3;
  if (passo === 1) {
    app.innerHTML = `<section class="pannello centro">
      <h1>${t("ciao").replace("{nome}", esc(profiloCorrente().nome))} ${t("quantaVoglia")}</h1>
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
      <label class="btn btn-pri">📷 ${t("scatta")}<input type="file" accept="image/*" capture="environment" multiple class="file-input" id="in-camera"></label>
      <label class="btn btn-sec">🖼️ ${t("galleria")}<input type="file" accept="image/*" multiple class="file-input" id="in-galleria"></label>
    </div>
    <div class="anteprime">${bozza.immagini.map((img, i) => `<figure><img src="${img.anteprima}" alt="${t("pagina")} ${i + 1}"><button class="x" data-rimuovi="${i}" aria-label="${t("rimuovi")}">×</button></figure>`).join("")}</div>
    <p class="nota">${t("contaFoto").replace("{n}", bozza.immagini.length).replace("{max}", 8)} · ${t("avvisoFoto")}</p>
    <label class="campo" for="note">${t("noteFacoltative")}<textarea id="note" rows="2" maxlength="500" placeholder="${t("notePlaceholder")}">${esc(bozza.note)}</textarea></label>
    <button class="btn btn-pri grande" id="genera" ${bozza.immagini.length ? "" : "disabled"}>✨ ${t("creaScheda")}</button>
    <p class="nota centro">${testoUtilizzo()}</p>
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
  const stop = caricamento(MSG_CARICAMENTO);
  try {
    const scheda = await api("POST", "/api/scheda", {
      profilo: pref("profilo"),
      materia: bozza.materia,
      energia: bozza.energia,
      note: bozza.note,
      immagini: bozza.immagini.map(({ mediaType, data }) => ({ mediaType, data })),
    });
    Object.assign(bozza, { energia: null, materia: null, immagini: [], note: "" });
    await aggiornaIo().catch(() => {});
    location.hash = `#/scheda/${scheda.id}`;
  } catch (e) {
    toast(e.message);
    if (e.codice === "limite") await aggiornaIo().catch(() => {});
    vistaNuova();
  } finally {
    stop();
  }
}

// ---------- scheda ----------
async function vistaScheda(id) {
  let s;
  try {
    s = await api("GET", `/api/schede/${encodeURIComponent(id)}`);
  } catch {
    return (location.hash = "#/archivio");
  }
  const sessione = s.sessioni.at(-1);
  const sessioneAperta = sessione && !sessione.fine && Date.now() - new Date(sessione.data) < 6 * 3600_000;
  const salvaParziale = (campi) => api("PATCH", `/api/schede/${s.id}`, campi).catch((e) => toast(e.message));

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

  attivaBase(app, s.vero_falso ?? [], etichetteBase(), (ok, tot) => {
    s.test.push({ data: new Date().toISOString(), ok, tot });
    salvaParziale({ test: s.test });
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
      salvaParziale({ sessioni: s.sessioni });
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
      salvaParziale({ sessioni: s.sessioni });
      app.querySelectorAll("[data-fine]").forEach((b) => b.classList.toggle("scelto", b === fine));
      return toast(t("fineRisposta_" + fine.dataset.fine));
    }
    if (ev.target.closest("#stampa")) return window.print();
    if (ev.target.closest("#esporta")) return esportaHTML(s).catch(() => toast(t("erroreGenerico")));
    if (ev.target.closest("#elimina") && confirm(t("confermaElimina"))) {
      await api("DELETE", `/api/schede/${s.id}`, {}).catch((e) => toast(e.message));
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
      const agg = await api("POST", "/api/verifica-tentativo", { scheda: s.id, esercizio: i, immagini });
      toast(agg.esiti[i]?.tentativo_serio ? t("tentativoOk") : t("tentativoNo"));
      await vistaScheda(id);
      document.getElementById("sez-esercizi")?.scrollIntoView();
    } catch (e) {
      toast(e.message);
      box.querySelector(".attesa")?.remove();
    }
  };
}

// ---------- archivio ----------
async function vistaArchivio() {
  const schede = await api("GET", `/api/schede?profilo=${pref("profilo")}`);
  const filtro = pref("filtroMateria") ?? "";
  const visibili = filtro ? schede.filter((s) => s.materia === filtro) : schede;
  const gruppi = new Map();
  for (const s of visibili) gruppi.set(s.materia, [...(gruppi.get(s.materia) ?? []), s]);
  const presenti = [...new Set(schede.map((s) => s.materia))];

  app.innerHTML = `<section class="pannello">
    <h1>🗂️ ${t("archivio")} · ${esc(profiloCorrente().nome)}</h1>
    ${schede.length ? `<label class="campo">${t("filtraMateria")}
      <select id="filtro"><option value="">${t("tutte")}</option>${presenti.map((m) => `<option value="${m}" ${m === filtro ? "selected" : ""}>${t("materia_" + m)}</option>`).join("")}</select></label>` : `<p>${t("archivioVuoto")}</p><a class="btn btn-pri" href="#/nuova">✨ ${t("creaPrima")}</a>`}
    ${[...gruppi].map(([m, lista]) => `<h2>${emojiMateria(m)} ${t("materia_" + m)} <small>(${lista.length})</small></h2>
      <ul class="elenco">${lista.map(voceArchivio).join("")}</ul>`).join("")}
  </section>`;
  const sel = $("#filtro");
  if (sel) sel.onchange = (e) => (pref("filtroMateria", e.target.value), vistaArchivio());
}

function voceArchivio(s) {
  const r = s.riepilogo ?? {};
  const umore = [UMORE_INIZIO.find(([k]) => k === r.inizio)?.[1], UMORE_FINE.find(([k]) => k === r.fine)?.[1]].filter(Boolean).join(" → ");
  return `<li><a href="#/scheda/${esc(s.id)}">
    <span class="titolo">${s.tipo === "ripasso" ? "🔁 " : ""}${esc(s.titolo)}</span>
    <span class="meta">${esc(dataBreve(s.creata))}${umore ? " · " + umore : ""}${r.test ? ` · ✅ ${r.test.ok}/${r.test.tot}` : ""}</span>
  </a></li>`;
}

// ---------- ripasso ----------
async function vistaRipasso() {
  const schede = (await api("GET", `/api/schede?profilo=${pref("profilo")}`)).filter((s) => s.tipo === "scheda");
  const presenti = [...new Set(schede.map((s) => s.materia))];
  const materia = presenti.includes(pref("materiaRipasso")) ? pref("materiaRipasso") : presenti[0];
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
      <ul class="elenco check">${dellaMateria.map((s) => `<li><label><input type="checkbox" value="${esc(s.id)}" checked> ${esc(s.titolo)} <span class="meta">${esc(dataBreve(s.creata))}</span></label></li>`).join("")}</ul>
    </fieldset>
    <fieldset><legend>${t("perCosa")}</legend>
      <div class="modi">${["riassunto", "orale", "scritto"].map((m, i) => `<label class="chip"><input type="radio" name="modo" value="${m}" ${i === 0 ? "checked" : ""}> ${t("modo_" + m)}</label>`).join("")}</div>
    </fieldset>
    <button class="btn btn-pri grande" id="crea-ripasso">✨ ${t("creaRipasso")}</button>
    <p class="nota centro">${testoUtilizzo()}</p>
  </section>`;
  $("#mat-rip").onchange = (e) => (pref("materiaRipasso", e.target.value), vistaRipasso());
  app.onclick = async (ev) => {
    if (!ev.target.closest("#crea-ripasso")) return;
    const ids = [...app.querySelectorAll(".elenco input:checked")].map((i) => i.value).slice(0, 12);
    if (!ids.length) return toast(t("selezionaAlmenoUna"));
    const modalita = app.querySelector("input[name=modo]:checked").value;
    const stop = caricamento(MSG_CARICAMENTO);
    try {
      const r = await api("POST", "/api/ripasso", { profilo: pref("profilo"), schede: ids, modalita });
      await aggiornaIo().catch(() => {});
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
  app.innerHTML = `<section class="pannello">
    <h1>⚙️ ${t("impostazioni")}</h1>
    <label class="campo">${t("linguaApp")}
      <select id="lingua-app">${Object.entries(LINGUE_UI).map(([k, n]) => `<option value="${k}" ${k === lang() ? "selected" : ""}>${n}</option>`).join("")}</select></label>

    <h2>🧑‍🎓 ${t("profili")}</h2>
    <ul class="elenco">${io.profili.map((p) => `<li class="riga-profilo">
      <span><strong>${esc(p.nome)}</strong> <span class="meta">${t("livello_" + p.livello)} · ${t("lingua_" + p.lingua)}</span></span>
      <span><button class="btn btn-ghost" data-modifica="${p.id}">${t("modifica")}</button><button class="btn btn-ghost pericolo" data-elimina-profilo="${p.id}" aria-label="${t("elimina")} ${esc(p.nome)}">🗑️</button></span>
    </li>`).join("")}</ul>
    <div id="form-profilo"></div>
    <a class="btn btn-sec" href="#/profili">＋ ${t("aggiungiProfilo")}</a>

    ${io.admin ? `<h2>🛠️ ${t("admin")}</h2><a class="btn btn-sec" href="#/admin">${t("apriAdmin")}${io.inAttesa ? ` · ${t("adminDaApprovare").replace("{n}", io.inAttesa)}` : ""}</a>` : ""}

    <h2>👤 ${t("account")}</h2>
    <p>${esc(io.email)}</p>
    <p class="nota">${testoUtilizzo()}</p>
    <p class="nota">${t("datiServer")}</p>
    <div class="foto-azioni">
      <button class="btn btn-sec" id="esporta-dati">⬇️ ${t("esportaDati")}</button>
      <button class="btn btn-sec" id="esci">↩️ ${t("esci")}</button>
    </div>
    <details class="pericolo-zona"><summary>${t("eliminaAccount")}</summary>
      <p class="nota">${t("eliminaAccountTesto")}</p>
      <label class="campo" for="conferma-elimina">${t("scriviElimina")}<input id="conferma-elimina" autocomplete="off"></label>
      <button class="btn btn-ghost pericolo" id="elimina-account">🗑️ ${t("eliminaAccount")}</button>
    </details>
    <p><a href="#/privacy">${t("leggiPrivacy")}</a></p>
  </section>`;
  $("#lingua-app").onchange = (e) => (setLang(e.target.value), applicaTraduzioni(), vistaImpostazioni());
  $("#esci").onclick = () => esci();
  $("#esporta-dati").onclick = async () => {
    try {
      const dati = await api("GET", "/api/esporta");
      scarica(new Blob([JSON.stringify(dati, null, 2)], { type: "application/json" }), `studio-amico-dati-${dati.esportato.slice(0, 10)}.json`);
    } catch (e) {
      toast(e.message);
    }
  };
  $("#elimina-account").onclick = async () => {
    try {
      await api("DELETE", "/api/account", { conferma: $("#conferma-elimina").value.trim() });
      cancellaPref();
      toast(t("accountEliminato"));
      esci(false);
    } catch (e) {
      toast(e.message);
    }
  };
  app.onclick = async (ev) => {
    const mod = ev.target.closest("[data-modifica]");
    if (mod) {
      const p = io.profili.find((x) => x.id === mod.dataset.modifica);
      $("#form-profilo").innerHTML = `<div class="riquadro">${campiProfilo(p)}<button class="btn btn-pri" id="salva-profilo">${t("salva")}</button></div>`;
      $("#salva-profilo").onclick = async () => {
        try {
          Object.assign(p, await api("PATCH", `/api/profili/${p.id}`, leggiCampiProfilo()));
          aggiornaTestata();
          vistaImpostazioni();
          toast(t("salvato"));
        } catch (e) {
          toast(e.message);
        }
      };
      return;
    }
    const del = ev.target.closest("[data-elimina-profilo]");
    if (del && confirm(t("confermaEliminaProfilo"))) {
      try {
        await api("DELETE", `/api/profili/${del.dataset.eliminaProfilo}`, {});
        io.profili = io.profili.filter((x) => x.id !== del.dataset.eliminaProfilo);
        if (!profiloCorrente()) pref("profilo", null);
        aggiornaTestata();
        vistaImpostazioni();
      } catch (e) {
        toast(e.message);
      }
    }
  };
}

// ---------- iscrizione in attesa di approvazione ----------
function vistaAttesa() {
  const sospesa = io.famiglia.stato === "sospesa";
  app.innerHTML = `<section class="pannello centro">
    <h1>${sospesa ? "⏸️ " + t("sospesaTitolo") : "⏳ " + t("attesaTitolo")}</h1>
    <p>${sospesa ? t("sospesaTesto") : t("attesaTesto")}</p>
    <p class="nota">${esc(io.email)}</p>
    <button class="btn btn-pri" id="ricontrolla">${t("ricontrolla")}</button>
    <p><button class="link" id="esci">${t("esci")}</button></p>
  </section>`;
  $("#ricontrolla").onclick = async () => {
    io = null;
    await router();
  };
  $("#esci").onclick = () => esci();
}

// ---------- amministrazione (solo email in ADMIN_EMAILS) ----------
async function vistaAdmin() {
  if (!io.admin) return (location.hash = "#/impostazioni");
  const { famiglie, costi } = await api("GET", "/api/admin/famiglie");
  const data = (iso) => (iso ? dataBreve(iso) : "—");
  const usd = (n) => "$" + Number(n || 0).toFixed(n && n < 0.1 ? 3 : 2);
  const ordine = { in_attesa: 0, approvata: 1, sospesa: 2 };
  famiglie.sort((x, y) => ordine[x.stato ?? "approvata"] - ordine[y.stato ?? "approvata"]);
  const abbonati = famiglie.filter((f) => f.piano === "abbonato").length;
  const inAttesa = famiglie.filter((f) => f.stato === "in_attesa").length;
  const riga = (tipo) => {
    const c = costi.perTipo[tipo];
    return c ? `<tr><td>${t("costo_" + tipo)}</td><td>${c.n}</td><td>${usd(c.medio)}</td><td>${usd(c.costo)}</td><td>${c.tokenInMedi} / ${c.tokenOutMedi}</td></tr>` : "";
  };

  app.innerHTML = `<section class="pannello">
    <h1>🛠️ ${t("admin")}</h1>
    <div class="numeri">
      <div><strong>${famiglie.length}</strong><span>${t("adminFamiglie")}</span></div>
      <div><strong>${inAttesa}</strong><span>${t("adminInAttesa")}</span></div>
      <div><strong>${abbonati}</strong><span>${t("adminAbbonati")}</span></div>
    </div>

    <h2>💶 ${t("costiTitolo")}</h2>
    <p class="nota">${t("costiTesto")}</p>
    <div class="numeri">
      <div><strong>${usd(costi.totale)}</strong><span>${t("costiTotale")}</span></div>
      <div><strong>${costi.richieste}</strong><span>${t("costiRichieste")}</span></div>
      <div><strong>${usd(costi.perTipo.scheda?.medio)}</strong><span>${t("costiMedioScheda")}</span></div>
    </div>
    ${costi.richieste ? `<div class="tabella-scroll"><table class="tabella">
      <thead><tr><th>${t("costiTipo")}</th><th>${t("costiN")}</th><th>${t("costiMedio")}</th><th>${t("costiTot")}</th><th>${t("costiToken")}</th></tr></thead>
      <tbody>${riga("scheda")}${riga("ripasso")}${riga("verifica")}</tbody>
    </table></div><p class="nota">${t("costiModelli")}: ${esc(costi.modelli.join(", "))}</p>` : ""}

    <h2>👨‍👩‍👧 ${t("adminIscritti")}</h2>
    <label class="campo" for="cerca">${t("adminCerca")}<input id="cerca" type="search" autocomplete="off"></label>
    <button class="btn btn-sec" id="csv">⬇️ ${t("adminCsv")}</button>
    <ul class="elenco" id="lista-famiglie">${famiglie.map((f) => `<li class="famiglia stato-${esc(f.stato ?? "approvata")}" data-email="${esc((f.email ?? "").toLowerCase())}">
      <p><span class="badge stato">${t("stato_" + (f.stato ?? "approvata"))}</span> <strong>${esc(f.email ?? t("adminSenzaEmail"))}</strong></p>
      <p class="meta">${t("adminIscritta")} ${data(f.creata)} · ${t("adminConsenso")} ${data(f.consenso_at)} · ${f.profili} ${t("adminProfili")} · ${f.schede} ${t("adminSchedeTot")}</p>
      <p class="meta">${t("adminMese")}: ${f.mese.schede}/${f.limiteSchede} ${t("adminSchede")}, ${f.mese.verifiche} ${t("adminVerifiche")} · ${t("costiFamiglia")} ${usd(f.costoMese)}</p>
      <div class="riga-piano">
        ${f.stato !== "approvata" ? `<button class="btn btn-pri" data-stato="approvata" data-id="${f.id}">✅ ${t("approva")}</button>` : ""}
        ${f.stato !== "sospesa" ? `<button class="btn btn-ghost pericolo" data-stato="sospesa" data-id="${f.id}">⏸️ ${t("sospendi")}</button>` : ""}
      </div>
      <div class="riga-piano">
        <select data-piano="${f.id}" aria-label="${t("adminPiano")}">
          <option value="prova" ${f.piano === "prova" ? "selected" : ""}>${t("pianoProva")}</option>
          <option value="abbonato" ${f.piano === "abbonato" ? "selected" : ""}>${t("pianoAbbonato")}</option>
        </select>
        <input type="date" data-scade="${f.id}" value="${f.abbonamento_scade ? f.abbonamento_scade.slice(0, 10) : ""}" aria-label="${t("adminScade")}">
        <button class="btn btn-sec" data-salva-piano="${f.id}">${t("salva")}</button>
      </div>
    </li>`).join("")}</ul>
    <p class="nota">${t("adminNotaPrivacy")}</p>
  </section>`;

  $("#cerca").oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    app.querySelectorAll(".famiglia").forEach((li) => (li.hidden = q && !li.dataset.email.includes(q)));
  };
  $("#csv").onclick = () => {
    const cella = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const righe = [["email", "stato", "iscritta", "consenso", "piano", "scadenza", "profili", "schede_totali", "schede_mese", "limite_mese", "verifiche_mese", "costo_mese_usd"]]
      .concat(famiglie.map((f) => [f.email, f.stato, f.creata, f.consenso_at, f.piano, f.abbonamento_scade, f.profili, f.schede, f.mese.schede, f.limiteSchede, f.mese.verifiche, Number(f.costoMese).toFixed(4)]))
      .map((r) => r.map(cella).join(","));
    scarica(new Blob(["\ufeff" + righe.join("\n")], { type: "text/csv" }), `studio-amico-iscritti-${new Date().toISOString().slice(0, 10)}.csv`);
  };
  app.onclick = async (ev) => {
    const st = ev.target.closest("[data-stato]");
    const pi = ev.target.closest("[data-salva-piano]");
    if (!st && !pi) return;
    const id = st?.dataset.id ?? pi.dataset.salvaPiano;
    const corpo = st
      ? { stato: st.dataset.stato }
      : { piano: app.querySelector(`[data-piano="${id}"]`).value, abbonamento_scade: app.querySelector(`[data-scade="${id}"]`).value || null };
    try {
      await api("PATCH", `/api/admin/famiglie/${id}`, corpo);
      toast(t("salvato"));
      await aggiornaIo();
      vistaAdmin();
    } catch (e) {
      toast(e.message);
    }
  };
}

function vistaPrivacy() {
  app.innerHTML = `<section class="pannello testo">
    <h1>🔒 ${t("privacyTitolo")}</h1>
    ${t("privacyTesto")}
    <p><a href="#/">${t("indietro")}</a></p>
  </section>`;
}

// Accesso dal link nell'email: Supabase torna all'app con la sessione nell'indirizzo (#access_token=...).
function sessioneDaLink() {
  const h = location.hash.slice(1);
  if (!/(^|&)(access_token|error)=/.test(h)) return;
  const p = new URLSearchParams(h);
  history.replaceState(null, "", location.pathname + location.search + "#/");
  if (p.get("access_token") && p.get("refresh_token")) {
    pref("sessione", {
      access_token: p.get("access_token"),
      refresh_token: p.get("refresh_token"),
      expires_at: Number(p.get("expires_at")) || Math.floor(Date.now() / 1000) + 3600,
    });
    io = null;
  } else {
    toast(p.get("error_description") || t("linkNonValido"));
  }
}

// ---------- router ----------
async function router() {
  sessioneDaLink();
  app.onclick = app.onchange = null;
  window.scrollTo(0, 0);
  const [, vista, id] = location.hash.split("/");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("attivo", a.dataset.nav === (vista || "nuova")));
  const menu = $(".tabbar");
  if (vista === "privacy") return vistaPrivacy();

  menu.hidden = true;
  aggiornaTestata();
  if (!pref("sessione")) return vistaLogin();
  try {
    if (!io) await aggiornaIo();
  } catch (e) {
    if (e.codice !== "sessione") toast(e.message);
    return;
  }
  if (!io.famiglia.consenso_at) return vistaConsenso();
  if (io.approvazione && io.famiglia.stato !== "approvata" && !io.admin) return vistaAttesa();
  if (vista === "profili" || !profiloCorrente()) {
    if (vista !== "profili" && io.profili.length === 1) pref("profilo", io.profili[0].id);
    else return vistaProfili();
  }
  aggiornaTestata();
  menu.hidden = false;
  try {
    switch (vista) {
      case "scheda": return await vistaScheda(decodeURIComponent(id ?? ""));
      case "archivio": return await vistaArchivio();
      case "ripasso": return await vistaRipasso();
      case "impostazioni": return vistaImpostazioni();
      case "admin": return await vistaAdmin();
      default: return vistaNuova();
    }
  } catch (e) {
    toast(e.message);
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
