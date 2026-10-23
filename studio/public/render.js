// Rendering delle schede in HTML (usato dall'app, dalla stampa e dall'export HTML).
import { t, lang } from "./i18n.js";

export const ELENCO_MATERIE = [
  ["italiano", "📖"], ["matematica", "➗"], ["fisica", "🧲"], ["scienze", "🔬"], ["storia", "🏛️"],
  ["geografia", "🌍"], ["inglese", "🗣️"], ["latino_greco", "🏺"], ["filosofia", "🤔"], ["arte", "🎨"],
  ["informatica", "💻"], ["educazione_civica", "⚖️"], ["diritto_economia", "📊"], ["scienze_umane", "🧠"],
  ["musica", "🎵"], ["altro", "📚"],
];
export const emojiMateria = (k) => (ELENCO_MATERIE.find(([m]) => m === k) ?? ELENCO_MATERIE.at(-1))[1];

export const UMORE_INIZIO = [["poca", "🐢"], ["media", "🙂"], ["tanta", "🚀"]];
export const UMORE_FINE = [["fatica", "😮‍💨"], ["bene", "🙂"], ["top", "🤩"]];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const lista = (arr, fn) => (Array.isArray(arr) ? arr.map(fn).join("") : "");

export const dataBreve = (iso) =>
  new Date(iso).toLocaleDateString(lang(), { day: "numeric", month: "short", year: "numeric" });

function sezione(id, icona, titolo, corpo, extraClass = "") {
  if (!corpo) return "";
  return `<section class="sez ${extraClass}" id="sez-${id}"><h2><span aria-hidden="true">${icona}</span> ${esc(titolo)}</h2>${corpo}</section>`;
}

function esercizi(s, modo) {
  return lista(s.esercizi, (e, i) => {
    const esito = s.esiti?.[i];
    let tentativo = "";
    if (modo === "app") {
      tentativo = esito
        ? `<div class="esito ${esito.tentativo_serio ? "ok" : "no"}">
            <p><strong>${esc(esito.motivazione)}</strong></p>
            <p>${esc(esito.feedback_sul_tentativo)}</p>
            ${esito.tentativo_serio ? `<details open><summary>${t("soluzioneGuidata")}</summary><div class="pre">${esc(esito.soluzione_guidata)}</div></details>` : ""}
          </div>`
        : "";
      if (!esito?.tentativo_serio) {
        tentativo += `<label class="btn btn-sec no-print">📷 ${t("caricaTentativo")}
          <input type="file" accept="image/*" multiple class="file-input" data-tentativo="${i}"></label>
          <p class="nota no-print">${t("notaTentativo")}</p>`;
      }
    } else {
      tentativo = `<p class="nota no-print">${t("notaTentativoExport")}</p>`;
    }
    return `<article class="esercizio">
      <div class="riga"><span class="badge d-${esc(e.difficolta)}">${t("diff_" + e.difficolta)}</span><span class="num">${i + 1}</span></div>
      <p>${esc(e.consegna)}</p>
      ${e.suggerimento ? `<details class="no-print"><summary>💡 ${t("suggerimento")}</summary><p>${esc(e.suggerimento)}</p></details>` : ""}
      <div class="spazio solo-stampa"></div>
      ${tentativo}
    </article>`;
  });
}

function domande(s) {
  return lista(s.domande, (d, i) => `<article class="domanda" data-domanda="${i}">
    <p><span class="badge">${t("tipo_" + d.tipo)}</span> ${esc(d.domanda)}</p>
    <textarea class="no-print" rows="3" placeholder="${t("scriviRisposta")}" aria-label="${t("scriviRisposta")}"></textarea>
    <button class="btn btn-sec no-print" data-confronta="${i}" disabled>${t("confronta")}</button>
    <div class="traccia hidden"><strong>${t("traccia")}:</strong> ${esc(d.traccia_risposta)}</div>
    <div class="spazio piccolo solo-stampa"></div>
  </article>`);
}

function veroFalso(s) {
  const items = lista(s.vero_falso, (v, i) => `<li class="vf" data-vf="${i}">
    <p>${esc(v.affermazione)}</p>
    <div class="vf-btn no-print">
      <button class="btn btn-vf" data-risposta="true">${t("vero")}</button>
      <button class="btn btn-vf" data-risposta="false">${t("falso")}</button>
    </div>
    <span class="solo-stampa caselle">☐ ${t("vero_breve")} &nbsp; ☐ ${t("falso_breve")}</span>
    <p class="vf-fb hidden"></p>
  </li>`);
  const chiave = lista(s.vero_falso, (v, i) => `<li>${i + 1}. ${v.vero ? t("vero") : t("falso")} — ${esc(v.spiegazione)}</li>`);
  return `<ol class="vf-lista">${items}</ol>
    <p class="vf-punteggio no-print" aria-live="polite"></p>
    <button class="btn btn-sec no-print" data-vf-reset>${t("rifaiTest")}</button>
    <div class="solo-stampa chiave"><h3>${t("chiaveTest")}</h3><ol class="semplice">${chiave}</ol></div>`;
}

export function renderScheda(s, modo = "app") {
  const avvisi = s.avvisi?.length
    ? `<div class="avvisi" role="note">⚠️ ${lista(s.avvisi, (a) => `<p>${esc(a)}</p>`)}</div>`
    : "";
  const schema = s.schema?.length
    ? `<ol class="schema">${lista(s.schema, (n) => `<li><strong>${esc(n.titolo)}</strong>
        <ul>${lista(n.punti, (p) => `<li>${esc(p)}</li>`)}</ul>
        ${n.sotto?.length ? `<ol>${lista(n.sotto, (x) => `<li><strong>${esc(x.titolo)}</strong><ul>${lista(x.punti, (p) => `<li>${esc(p)}</li>`)}</ul></li>`)}</ol>` : ""}
      </li>`)}</ol>`
    : "";
  const concetti = s.concetti_chiave?.length
    ? `<dl class="concetti">${lista(s.concetti_chiave, (c) => `<div><dt>${esc(c.termine)}</dt><dd>${esc(c.definizione)}</dd></div>`)}</dl>`
    : "";
  const vita = s.vita_reale?.length
    ? `<div class="griglia">${lista(s.vita_reale, (v) => `<div class="card-mini"><strong>${esc(v.titolo)}</strong><p>${esc(v.descrizione)}</p></div>`)}</div>`
    : "";
  const piano = s.piano_ripasso?.length
    ? `<ul class="piano">${lista(s.piano_ripasso, (p) => `<li><strong>${esc(p.quando)}</strong> — ${esc(p.attivita)}</li>`)}</ul>`
    : "";
  const tipo = s.tipo === "ripasso" ? `<span class="badge">${t("modo_" + s.modalita)}</span>` : "";

  return `<div class="scheda">
    <header class="scheda-head">
      <p class="meta">${esc(s.materiaEmoji || emojiMateria(s.materia))} ${esc(s.materiaNome || t("materia_" + s.materia))} · ${esc(dataBreve(s.creata))} ${tipo}</p>
      <h1>${esc(s.titolo)}</h1>
    </header>
    ${avvisi}
    ${sezione("abstract", "✨", t("abstract"), s.abstract ? `<p class="abstract">${esc(s.abstract)}</p>` : "")}
    ${sezione("schema", "🗺️", t("schema"), schema)}
    ${sezione("concetti", "🔑", t("concetti"), concetti)}
    ${sezione("esercizi", "✏️", t("esercizi"), esercizi(s, modo), "pagina-nuova")}
    ${sezione("domande", "❓", t("domande"), domande(s))}
    ${sezione("vf", "✅", t("testVF"), s.vero_falso?.length ? veroFalso(s) : "", "pagina-nuova")}
    ${sezione("vita", "🌱", t("vitaReale"), vita)}
    ${sezione("piano", "📅", t("pianoRipasso"), piano)}
    ${sezione("metodo", "🧭", t("consiglioMetodo"), s.consiglio_metodo ? `<p>${esc(s.consiglio_metodo)}</p>` : "")}
    <footer class="scheda-foot">${t("footerAI")}</footer>
  </div>`;
}

// Interattività di base (test V/F e domande). Funzione AUTOSUFFICIENTE: viene
// copiata così com'è dentro l'HTML esportato, quindi non deve usare import o variabili esterne.
export function attivaBase(root, vf, L, onTest) {
  const risposte = {};
  const aggiornaPunteggio = () => {
    const n = Object.keys(risposte).length;
    const ok = Object.values(risposte).filter(Boolean).length;
    const el = root.querySelector(".vf-punteggio");
    if (!el) return;
    el.textContent = n ? L.punteggio.replace("{ok}", ok).replace("{n}", n).replace("{tot}", vf.length) : "";
    if (n === vf.length) {
      el.textContent += " " + (ok >= 8 ? L.esito_top : ok >= 5 ? L.esito_bene : L.esito_dai);
      if (onTest) onTest(ok, vf.length);
    }
  };
  root.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-risposta]");
    if (b) {
      const li = b.closest("[data-vf]");
      const i = Number(li.dataset.vf);
      if (i in risposte) return;
      const giusta = String(vf[i].vero) === b.dataset.risposta;
      risposte[i] = giusta;
      li.classList.add(giusta ? "giusto" : "sbagliato");
      li.querySelectorAll("[data-risposta]").forEach((x) => (x.disabled = true));
      const fb = li.querySelector(".vf-fb");
      fb.textContent = (giusta ? "👍 " + L.giusto : "🔁 " + L.sbagliato) + " " + vf[i].spiegazione;
      fb.classList.remove("hidden");
      aggiornaPunteggio();
      return;
    }
    if (ev.target.closest("[data-vf-reset]")) {
      Object.keys(risposte).forEach((k) => delete risposte[k]);
      root.querySelectorAll("[data-vf]").forEach((li) => {
        li.classList.remove("giusto", "sbagliato");
        li.querySelectorAll("[data-risposta]").forEach((x) => (x.disabled = false));
        li.querySelector(".vf-fb").classList.add("hidden");
      });
      aggiornaPunteggio();
      return;
    }
    const c = ev.target.closest("[data-confronta]");
    if (c) c.closest("[data-domanda]").querySelector(".traccia").classList.remove("hidden");
  });
  // La traccia si sblocca solo dopo aver scritto una risposta (pratica del recupero).
  root.addEventListener("input", (ev) => {
    if (ev.target.matches("[data-domanda] textarea")) {
      ev.target.closest("[data-domanda]").querySelector("[data-confronta]").disabled = ev.target.value.trim().length < 15;
    }
  });
}

export function etichetteBase() {
  return Object.fromEntries(
    ["punteggio", "esito_top", "esito_bene", "esito_dai", "giusto", "sbagliato"].map((k) => [k, t(k)]),
  );
}
