// Versione di Studio Amico pubblicata su claude.ai.
// Claude viene chiamato con l'account di chi usa la pagina (capacità "sample"),
// le schede si salvano nello spazio privato dell'utente (capacità "db"),
// i file si scaricano con la capacità "downloads". Il build (build.mjs) unisce
// questo file con i18n.js, render.js, pedagogia.js, prompt.js e schemas.js.

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");
const HTML2PDF = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
const LIVELLI_UI = ["primaria", "media1", "media2", "media3", "sup1", "sup2", "sup3", "sup4", "sup5"];
const LINGUE_SCHEDE = ["it", "en", "es", "fr", "de"];
const MAX_FOTO = 8;

// Testi specifici di questa versione.
Object.assign(DIZ.it, {
  priv1: "Le tue schede sono salvate nel tuo spazio privato su claude.ai: le vedi solo tu, anche da altri dispositivi.",
  priv2: "Le foto vengono mandate a Claude con il tuo account solo per creare la scheda e non vengono salvate.",
  privacyTesto: `<p><strong>Dove stanno le schede:</strong> nello spazio privato di questa pagina sul tuo account claude.ai. Nemmeno chi ha creato la pagina può leggerle.</p>
    <p><strong>Cosa viene inviato a Claude:</strong> le foto delle pagine e dei tentativi (ridotte e senza dati nascosti come la posizione GPS) e, per il ripasso, i testi delle schede scelte. L'umore e le date non vengono inviati.</p>
    <p><strong>Foto dei tentativi:</strong> servono solo a controllare l'esercizio; resta salvato solo il commento.</p>
    <p><strong>Contenuti generati da IA:</strong> possono contenere errori. Controlla sempre con il libro e con l'insegnante.</p>
    <p><strong>Cancellazione:</strong> Impostazioni → "Cancella tutti i dati".</p>`,
  scaricaPdf: "PDF A4", scaricaHtml: "HTML", preparoPdf: "Preparo il PDF…", fileSalvato: "File salvato.",
  downloadNonDisponibile: "Il download non è disponibile in questa vista.",
  annulla: "Annulla", conferma: "Conferma",
  claudeNonDisponibile: "Claude non è disponibile qui: apri la pagina da claude.ai con il tuo account.",
  err_not_granted: "Non hai dato il permesso di usare Claude. Ricarica la pagina e premi «Consenti».",
  err_rate_limited: "Troppe richieste: fai una pausa di qualche minuto e riprova.",
  err_refused: "Claude non può elaborare questo materiale. Prova con altre pagine.",
  err_invalid_json: "La risposta è arrivata incompleta. Riprova.",
  err_image_rejected: "Una foto non va bene (formato o dimensione). Prova a rifarla.",
  err_session_expired: "Sessione scaduta: accedi di nuovo a claude.ai.",
  err_sampling_disabled: "Claude non è attivo per questo account.",
  salvataggioLocale: "Le schede sono salvate solo in questo browser (accesso a claude.ai non disponibile).",
});
Object.assign(DIZ.en, {
  priv1: "Your cards are saved in your private space on claude.ai: only you can see them, from any device.",
  priv2: "Photos are sent to Claude with your account only to create the card and are not saved.",
  privacyTesto: `<p><strong>Where cards are kept:</strong> in this page's private space on your claude.ai account. Not even the page's author can read them.</p>
    <p><strong>What is sent to Claude:</strong> photos of pages and attempts (resized, with hidden data such as GPS location removed) and, for reviews, the text of the chosen cards. Mood and dates are not sent.</p>
    <p><strong>Attempt photos:</strong> used only to check the exercise; only the comment is kept.</p>
    <p><strong>AI-generated content:</strong> may contain mistakes. Always check with your book and teacher.</p>
    <p><strong>Deletion:</strong> Settings → "Delete all data".</p>`,
  scaricaPdf: "A4 PDF", scaricaHtml: "HTML", preparoPdf: "Preparing the PDF…", fileSalvato: "File saved.",
  downloadNonDisponibile: "Downloads are not available in this view.",
  annulla: "Cancel", conferma: "Confirm",
  claudeNonDisponibile: "Claude is not available here: open the page from claude.ai with your account.",
  err_not_granted: "You didn't allow this page to use Claude. Reload the page and tap “Allow”.",
  err_rate_limited: "Too many requests: take a short break and try again.",
  err_refused: "Claude can't process this material. Try other pages.",
  err_invalid_json: "The answer arrived incomplete. Try again.",
  err_image_rejected: "A photo can't be used (format or size). Try taking it again.",
  err_session_expired: "Session expired: sign in to claude.ai again.",
  err_sampling_disabled: "Claude is not enabled for this account.",
  salvataggioLocale: "Cards are saved only in this browser (claude.ai storage not available).",
});

// ---------- capacità della pagina ----------
const cap = { sample: null, limiti: null, downloads: null, store: null };
const capPronte = (async () => {
  if (!window.claude?.use) return;
  const usa = (n) => window.claude.use(n).catch(() => null);
  const [sample, db, user, downloads] = await Promise.all([usa("sample"), usa("db"), usa("user"), usa("downloads")]);
  cap.sample = sample;
  cap.downloads = downloads;
  if (sample) cap.limiti = await sample.limits().catch(() => null);
  const uid = user ? await user.id() : null;
  if (db && uid) cap.store = db.collection("data/users/" + uid);
})();

// Archivio: spazio privato su claude.ai, oppure IndexedDB del browser se non disponibile.
const clona = (o) => JSON.parse(JSON.stringify(o));
const archivio = {
  async tutte() {
    await capPronte;
    const lista = cap.store
      ? (await cap.store.get()).docs.filter((d) => d.id.startsWith("s_")).map((d) => clona(d.data()))
      : await tutte();
    return lista.sort((a, b) => b.creata.localeCompare(a.creata));
  },
  async leggi(id) {
    await capPronte;
    if (!cap.store) return leggi(id);
    const d = await cap.store.doc(id).get();
    return d.exists ? clona(d.data()) : null;
  },
  async salva(s) {
    await capPronte;
    return cap.store ? cap.store.doc(s.id).set(clona(s)) : salva(s);
  },
  async elimina(id) {
    await capPronte;
    return cap.store ? cap.store.doc(id).delete() : elimina(id);
  },
  async svuota() {
    await capPronte;
    if (!cap.store) return svuota();
    for (const d of (await cap.store.get()).docs) await cap.store.doc(d.id).delete();
  },
};

// ---------- utilità ----------
function impostazioni() {
  return { livello: pref("livello") ?? "media2", linguaSchede: pref("linguaSchede") ?? lang() };
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("visibile");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visibile"), 4000);
}

const nuovoId = () => "s_" + [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");

// Conferma dentro la pagina (confirm() non funziona negli artifact).
function chiedi(msg) {
  const d = $("#dialogo");
  $("#dialogo-msg").textContent = msg;
  d.hidden = false;
  $("#dialogo-ok").focus();
  return new Promise((ok) => {
    const chiudi = (v) => () => ((d.hidden = true), ok(v));
    $("#dialogo-ok").onclick = chiudi(true);
    $("#dialogo-no").onclick = chiudi(false);
  });
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

// Ricodifica in JPEG ridotto: peso minore e niente metadati EXIF.
async function preparaFoto(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scala);
  c.height = Math.round(bmp.height * scala);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
  return { blob, anteprima: URL.createObjectURL(blob) };
}

// ---------- Claude ----------
async function chiediClaude(istruzioni, schema, immagini) {
  await capPronte;
  if (!cap.sample) throw new Error(t("claudeNonDisponibile"));
  const prompt = `${SISTEMA_BASE}

${istruzioni}

Rispondi SOLO con un oggetto JSON valido che rispetti questo JSON Schema, senza testo prima o dopo e senza blocchi di codice:
${JSON.stringify(schema)}`;
  const opzioni = { cache: false };
  if (immagini?.length) opzioni.images = immagini;
  try {
    return await cap.sample.json(prompt, opzioni);
  } catch (e) {
    throw new Error(DIZ.it["err_" + e?.code] ? t("err_" + e.code) : t("erroreGenerico"));
  }
}

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
const scelta = (v, ammessi, def) => (ammessi.includes(v) ? v : def);

// L'output di Claude è dato non fidato: si tiene solo la forma attesa.
function normalizzaScheda(o) {
  const s = {
    titolo: str(o?.titolo).slice(0, 200) || "Scheda",
    abstract: str(o?.abstract),
    schema: arr(o?.schema).map((n) => ({
      titolo: str(n?.titolo),
      punti: arr(n?.punti).map(str),
      sotto: arr(n?.sotto).map((x) => ({ titolo: str(x?.titolo), punti: arr(x?.punti).map(str) })),
    })),
    concetti_chiave: arr(o?.concetti_chiave).map((c) => ({ termine: str(c?.termine), definizione: str(c?.definizione) })),
    esercizi: arr(o?.esercizi).map((e) => ({
      consegna: str(e?.consegna),
      difficolta: scelta(e?.difficolta, ["base", "medio", "avanzato"], "medio"),
      suggerimento: str(e?.suggerimento),
    })),
    domande: arr(o?.domande).map((d) => ({
      domanda: str(d?.domanda),
      tipo: scelta(d?.tipo, ["comprensione", "ragionamento", "collegamento"], "comprensione"),
      traccia_risposta: str(d?.traccia_risposta),
    })),
    vero_falso: arr(o?.vero_falso).map((v) => ({ affermazione: str(v?.affermazione), vero: v?.vero === true, spiegazione: str(v?.spiegazione) })),
    vita_reale: arr(o?.vita_reale).map((v) => ({ titolo: str(v?.titolo), descrizione: str(v?.descrizione) })),
    piano_ripasso: arr(o?.piano_ripasso).map((p) => ({ quando: str(p?.quando), attivita: str(p?.attivita) })),
    consiglio_metodo: str(o?.consiglio_metodo),
    avvisi: arr(o?.avvisi).map(str).filter(Boolean),
  };
  if (s.vero_falso.length !== 10) s.avvisi.push(`Il test contiene ${s.vero_falso.length} domande invece di 10.`);
  return s;
}

// ---------- file ----------
async function salvaFile(filename, data) {
  await capPronte;
  if (!cap.downloads) return toast(t("downloadNonDisponibile"));
  try {
    await cap.downloads.save({ filename, data });
    toast(t("fileSalvato"));
  } catch (e) {
    if (e?.code !== "declined") toast(t("downloadNonDisponibile"));
  }
}

const nomeFile = (s) =>
  `${s.creata.slice(0, 10)}-${s.materia}-${s.titolo}`.toLowerCase().normalize("NFD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").slice(0, 80);

const jsonSicuro = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

function htmlEsportato(s) {
  const vf = (s.vero_falso ?? []).map(({ vero, spiegazione }) => ({ vero, spiegazione }));
  return `<!doctype html>
<html lang="${lang()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.titolo)}</title>
<style>${$("#stile").textContent}</style>
</head>
<body class="export">
<main class="wrap">${renderScheda(s, "export")}</main>
<script>(${attivaBase.toString()})(document.body, ${jsonSicuro(vf)}, ${jsonSicuro(etichetteBase())});</script>
</body>
</html>`;
}

function caricaScript(src) {
  return new Promise((ok, ko) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = ok;
    el.onerror = ko;
    document.head.append(el);
  });
}

async function pdfScheda(s) {
  toast(t("preparoPdf"));
  if (!window.html2pdf) await caricaScript(HTML2PDF);
  // La libreria copia il foglio in un suo contenitore visibile: il contenitore esterno lo tiene fuori schermo qui.
  const fuori = document.createElement("div");
  fuori.className = "fuori-schermo";
  fuori.innerHTML = `<div class="foglio">${renderScheda(s, "app")}</div>`;
  document.body.append(fuori);
  const foglio = fuori.firstElementChild;
  try {
    const blob = await window.html2pdf()
      .set({
        margin: [14, 13, 14, 13],
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], before: [".pagina-nuova", ".chiave"], avoid: [".esercizio", ".domanda", ".vf", ".card-mini", ".concetti > div"] },
      })
      .from(foglio)
      .outputPdf("blob");
    await salvaFile(nomeFile(s) + ".pdf", blob);
  } finally {
    fuori.remove();
  }
}

// ---------- navigazione ----------
const stato = { vista: "nuova", id: null };
function vai(vista, id = null) {
  Object.assign(stato, { vista, id });
  render();
}

// ---------- consenso iniziale ----------
function vistaBenvenuto() {
  app.innerHTML = `<section class="pannello">
    <h1>${t("benvenuto")}</h1>
    <p>${t("benvenutoTesto")}</p>
    <ul class="privacy-lista">
      <li>🔒 ${t("priv1")}</li><li>🤖 ${t("priv2")}</li><li>🙈 ${t("priv3")}</li><li>🗑️ ${t("priv4")}</li>
    </ul>
    <label class="check"><input type="checkbox" id="consenso"> ${t("consensoGenitore")}</label>
    <button class="btn btn-pri" id="inizia" disabled>${t("iniziamo")}</button>
    <p class="nota"><button class="link" data-vai="privacy">${t("leggiPrivacy")}</button></p>
  </section>`;
  $("#consenso").onchange = (e) => ($("#inizia").disabled = !e.target.checked);
  $("#inizia").onclick = () => {
    pref("consenso", new Date().toISOString());
    vai("nuova");
  };
}

function vistaPrivacy() {
  app.innerHTML = `<section class="pannello testo">
    <h1>${t("privacyTitolo")}</h1>
    ${t("privacyTesto")}
    <p><button class="link" data-vai="nuova">← ${t("indietro")}</button></p>
  </section>`;
}

// ---------- nuova scheda ----------
const bozza = { energia: null, materia: null, foto: [], note: "" };

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
  const max = Math.min(MAX_FOTO, cap.limiti?.images?.maxCount ?? MAX_FOTO);
  app.innerHTML = `<section class="pannello">
    <p class="meta">${emojiMateria(bozza.materia)} ${t("materia_" + bozza.materia)} · <button class="link" id="cambia">${t("cambia")}</button></p>
    <h1>${t("fotografa")}</h1>
    <p>${t("fotografaTesto")}</p>
    <div class="foto-azioni">
      <label class="btn btn-pri">📷 ${t("scatta")}<input type="file" accept="image/*" capture="environment" hidden id="in-camera"></label>
      <label class="btn btn-sec">🖼️ ${t("galleria")}<input type="file" accept="image/*" multiple hidden id="in-galleria"></label>
    </div>
    <div class="anteprime">${bozza.foto.map((f, i) => `<figure><img src="${f.anteprima}" alt="${t("pagina")} ${i + 1}"><button class="x" data-rimuovi="${i}" aria-label="${t("rimuovi")}">×</button></figure>`).join("")}</div>
    <p class="nota">${t("contaFoto").replace("{n}", bozza.foto.length).replace("{max}", max)} · ${t("avvisoFoto")}</p>
    <label class="campo" for="note">${t("noteFacoltative")}<textarea id="note" rows="2" maxlength="500" placeholder="${t("notePlaceholder")}">${esc(bozza.note)}</textarea></label>
    <button class="btn btn-pri grande" id="genera" ${bozza.foto.length ? "" : "disabled"}>✨ ${t("creaScheda")}</button>
  </section>`;

  const aggiungi = async (files) => {
    for (const f of files) {
      if (bozza.foto.length >= max) {
        toast(t("maxFoto"));
        break;
      }
      try {
        bozza.foto.push(await preparaFoto(f));
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
    if (r) {
      URL.revokeObjectURL(bozza.foto[r.dataset.rimuovi].anteprima);
      bozza.foto.splice(Number(r.dataset.rimuovi), 1);
      return vistaNuova();
    }
    if (ev.target.closest("#genera")) generaScheda();
  };
}

async function generaScheda() {
  const imp = impostazioni();
  const stop = caricamento(MSG_CARICAMENTO);
  try {
    const input = { materia: bozza.materia, livello: imp.livello, lingua: imp.linguaSchede, energia: bozza.energia, note: bozza.note };
    const out = normalizzaScheda(await chiediClaude(istruzioniScheda(input), SCHEDA_SCHEMA, bozza.foto.map((f) => f.blob)));
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
    await archivio.salva(scheda);
    bozza.foto.forEach((f) => URL.revokeObjectURL(f.anteprima));
    Object.assign(bozza, { energia: null, materia: null, foto: [], note: "" });
    vai("scheda", scheda.id);
  } catch (e) {
    toast(e.message);
    vistaNuova();
  } finally {
    stop();
  }
}

// ---------- scheda ----------
async function vistaScheda(id) {
  const s = await archivio.leggi(id);
  if (!s) return vai("archivio");
  const sessione = s.sessioni.at(-1);
  const sessioneAperta = sessione && !sessione.fine && Date.now() - new Date(sessione.data) < 6 * 3600_000;

  app.innerHTML = `
    <div class="barra-azioni">
      <button class="link" data-vai="archivio">← ${t("archivio")}</button>
      <span class="spazio-flex"></span>
      <button class="btn btn-sec" id="pdf">⬇️ ${t("scaricaPdf")}</button>
      <button class="btn btn-sec" id="esporta">⬇️ ${t("scaricaHtml")}</button>
      <button class="btn btn-ghost" id="elimina" aria-label="${t("elimina")}">🗑️</button>
    </div>
    ${sessioneAperta ? "" : `<div class="banner" id="banner-inizio"><span>${t("quantaVoglia")}</span>
      ${UMORE_INIZIO.map(([k, e]) => `<button class="btn-umore mini" data-inizio="${k}" title="${t("energia_" + k)}">${e}</button>`).join("")}</div>`}
    <nav class="indice" aria-label="${t("sezioni")}">
      ${["abstract", "schema", "concetti", "esercizi", "domande", "vf", "vita", "piano"].map((k) => `<button data-salta="${k}">${t("nav_" + k)}</button>`).join("")}
    </nav>
    <div class="wrap-scheda">${renderScheda(s, "app")}</div>
    <section class="pannello centro" id="fine">
      <h2>${t("comeEAndata")}</h2>
      <div class="umore">${UMORE_FINE.map(([k, e]) => `<button class="btn-umore ${sessione?.fine === k && sessioneAperta ? "scelto" : ""}" data-fine="${k}"><span>${e}</span>${t("fine_" + k)}</button>`).join("")}</div>
    </section>`;

  attivaBase(app, s.vero_falso ?? [], etichetteBase(), async (ok, tot) => {
    s.test.push({ data: new Date().toISOString(), ok, tot });
    await archivio.salva(s);
  });

  app.onclick = async (ev) => {
    const salto = ev.target.closest("[data-salta]");
    if (salto) return document.getElementById("sez-" + salto.dataset.salta)?.scrollIntoView({ behavior: "smooth" });
    const ini = ev.target.closest("[data-inizio]");
    if (ini) {
      s.sessioni.push({ data: new Date().toISOString(), inizio: ini.dataset.inizio, fine: null });
      await archivio.salva(s);
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
      await archivio.salva(s);
      app.querySelectorAll("[data-fine]").forEach((b) => b.classList.toggle("scelto", b === fine));
      return toast(t("fineRisposta_" + fine.dataset.fine));
    }
    if (ev.target.closest("#pdf")) return pdfScheda(s).catch(() => toast(t("erroreGenerico")));
    if (ev.target.closest("#esporta")) return salvaFile(nomeFile(s) + ".html", htmlEsportato(s));
    if (ev.target.closest("#elimina") && (await chiedi(t("confermaElimina")))) {
      await archivio.elimina(s.id);
      vai("archivio");
    }
  };

  app.onchange = async (ev) => {
    const input = ev.target.closest("[data-tentativo]");
    if (!input?.files.length) return;
    const i = Number(input.dataset.tentativo);
    const box = input.closest(".esercizio");
    box.insertAdjacentHTML("beforeend", `<p class="nota attesa" role="status">⏳ ${t("controlloTentativo")}</p>`);
    try {
      const foto = [];
      for (const f of [...input.files].slice(0, 4)) foto.push((await preparaFoto(f)).blob);
      const imp = impostazioni();
      const o = await chiediClaude(
        istruzioniVerifica({
          materia: s.materia,
          livello: imp.livello,
          lingua: s.lingua,
          esercizio: { consegna: s.esercizi[i].consegna },
          contestoScheda: `${s.titolo}. ${s.abstract}`.slice(0, 2000),
        }),
        VERIFICA_SCHEMA,
        foto,
      );
      const serio = o?.tentativo_serio === true;
      // Niente soluzione senza tentativo serio; si salva solo il testo, non la foto.
      s.esiti[i] = {
        tentativo_serio: serio,
        motivazione: str(o?.motivazione),
        feedback_sul_tentativo: str(o?.feedback_sul_tentativo),
        soluzione_guidata: serio ? str(o?.soluzione_guidata) : "",
        data: new Date().toISOString(),
      };
      await archivio.salva(s);
      toast(serio ? t("tentativoOk") : t("tentativoNo"));
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
  app.innerHTML = `<div class="caricamento"><div class="spinner" aria-hidden="true"></div></div>`;
  const schede = await archivio.tutte();
  const filtro = pref("filtroMateria") ?? "";
  const visibili = filtro ? schede.filter((s) => s.materia === filtro) : schede;
  const gruppi = new Map();
  for (const s of visibili) gruppi.set(s.materia, [...(gruppi.get(s.materia) ?? []), s]);
  const presenti = [...new Set(schede.map((s) => s.materia))];

  app.innerHTML = `<section class="pannello">
    <h1>${t("archivio")}</h1>
    ${cap.store ? "" : `<p class="nota">${t("salvataggioLocale")}</p>`}
    ${schede.length ? `<label class="campo" for="filtro">${t("filtraMateria")}
      <select id="filtro"><option value="">${t("tutte")}</option>${presenti.map((m) => `<option value="${m}" ${m === filtro ? "selected" : ""}>${t("materia_" + m)}</option>`).join("")}</select></label>` : `<p>${t("archivioVuoto")}</p><button class="btn btn-pri" data-vai="nuova">✨ ${t("creaPrima")}</button>`}
    ${[...gruppi].map(([m, lista]) => `<h2>${emojiMateria(m)} ${t("materia_" + m)} <small>(${lista.length})</small></h2>
      <ul class="elenco">${lista.map(voceArchivio).join("")}</ul>`).join("")}
  </section>`;
  const sel = $("#filtro");
  if (sel) sel.onchange = (e) => (pref("filtroMateria", e.target.value), vistaArchivio());
  app.onclick = (ev) => {
    const v = ev.target.closest("[data-apri]");
    if (v) vai("scheda", v.dataset.apri);
  };
}

function voceArchivio(s) {
  const ultima = s.sessioni?.at(-1);
  const umore = [UMORE_INIZIO.find(([k]) => k === ultima?.inizio)?.[1], UMORE_FINE.find(([k]) => k === ultima?.fine)?.[1]].filter(Boolean).join(" → ");
  const test = s.test?.at(-1);
  return `<li><button class="voce" data-apri="${esc(s.id)}">
    <span class="titolo">${s.tipo === "ripasso" ? "🔁 " : ""}${esc(s.titolo)}</span>
    <span class="meta">${esc(dataBreve(s.creata))}${umore ? " · " + umore : ""}${test ? ` · ✅ ${test.ok}/${test.tot}` : ""}</span>
  </button></li>`;
}

// ---------- ripasso ----------
async function vistaRipasso() {
  app.innerHTML = `<div class="caricamento"><div class="spinner" aria-hidden="true"></div></div>`;
  const schede = (await archivio.tutte()).filter((s) => s.tipo === "scheda");
  const presenti = [...new Set(schede.map((s) => s.materia))];
  const materia = presenti.includes(pref("materiaRipasso")) ? pref("materiaRipasso") : presenti[0];
  if (!materia) {
    app.innerHTML = `<section class="pannello"><h1>${t("ripasso")}</h1><p>${t("ripassoVuoto")}</p></section>`;
    return;
  }
  const dellaMateria = schede.filter((s) => s.materia === materia);
  app.innerHTML = `<section class="pannello">
    <h1>${t("ripasso")}</h1>
    <p>${t("ripassoTesto")}</p>
    <label class="campo" for="mat-rip">${t("materia")}
      <select id="mat-rip">${presenti.map((m) => `<option value="${m}" ${m === materia ? "selected" : ""}>${t("materia_" + m)}</option>`).join("")}</select></label>
    <fieldset><legend>${t("qualiSchede")}</legend>
      <ul class="elenco check">${dellaMateria.map((s) => `<li><label><input type="checkbox" value="${esc(s.id)}" checked> ${esc(s.titolo)} <span class="meta">${esc(dataBreve(s.creata))}</span></label></li>`).join("")}</ul>
    </fieldset>
    <fieldset><legend>${t("perCosa")}</legend>
      <div class="modi">${["riassunto", "orale", "scritto"].map((m, i) => `<label class="chip"><input type="radio" name="modo" value="${m}" ${i === 0 ? "checked" : ""}> ${t("modo_" + m)}</label>`).join("")}</div>
    </fieldset>
    <button class="btn btn-pri grande" id="crea-ripasso">✨ ${t("creaRipasso")}</button>
  </section>`;
  $("#mat-rip").onchange = (e) => (pref("materiaRipasso", e.target.value), vistaRipasso());
  app.onclick = async (ev) => {
    if (!ev.target.closest("#crea-ripasso")) return;
    const ids = [...app.querySelectorAll(".elenco input:checked")].map((i) => i.value);
    if (!ids.length) return toast(t("selezionaAlmenoUna"));
    const modalita = app.querySelector("input[name=modo]:checked").value;
    const scelte = dellaMateria.filter((s) => ids.includes(s.id)).slice(0, 12).map((s) => contenutoPerRipasso(s));
    const imp = impostazioni();
    const stop = caricamento(MSG_CARICAMENTO);
    try {
      const out = normalizzaScheda(
        await chiediClaude(istruzioniRipasso({ materia, livello: imp.livello, lingua: imp.linguaSchede, modalita, schede: scelte }), SCHEDA_SCHEMA),
      );
      const r = { ...out, id: nuovoId(), tipo: "ripasso", modalita, fonti: ids, materia, lingua: imp.linguaSchede, creata: new Date().toISOString(), sessioni: [], esiti: {}, test: [] };
      await archivio.salva(r);
      vai("scheda", r.id);
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
    <h1>${t("impostazioni")}</h1>
    <label class="campo" for="lingua-app">${t("linguaApp")}
      <select id="lingua-app">${Object.entries(LINGUE_UI).map(([k, n]) => `<option value="${k}" ${k === lang() ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label class="campo" for="lingua-schede">${t("linguaSchede")}
      <select id="lingua-schede">${LINGUE_SCHEDE.map((k) => `<option value="${k}" ${k === imp.linguaSchede ? "selected" : ""}>${t("lingua_" + k)}</option>`).join("")}</select></label>
    <label class="campo" for="livello">${t("classe")}
      <select id="livello">${LIVELLI_UI.map((k) => `<option value="${k}" ${k === imp.livello ? "selected" : ""}>${t("livello_" + k)}</option>`).join("")}</select></label>
    <h2>${t("datiTitolo")}</h2>
    <p class="nota">${cap.store ? t("priv1") : t("salvataggioLocale")}</p>
    <div class="foto-azioni">
      <button class="btn btn-sec" id="backup">⬇️ ${t("backup")}</button>
      <label class="btn btn-sec">⬆️ ${t("ripristina")}<input type="file" accept="application/json,.json" hidden id="ripristina"></label>
      <button class="btn btn-ghost pericolo" id="cancella">🗑️ ${t("cancellaTutto")}</button>
    </div>
    <p><button class="link" data-vai="privacy">${t("leggiPrivacy")}</button></p>
  </section>`;
  $("#lingua-app").onchange = (e) => (setLang(e.target.value), applicaTraduzioni(), vistaImpostazioni());
  $("#lingua-schede").onchange = (e) => pref("linguaSchede", e.target.value);
  $("#livello").onchange = (e) => pref("livello", e.target.value);
  $("#backup").onclick = async () => {
    const dati = { app: "studio-amico", versione: 1, esportato: new Date().toISOString(), schede: await archivio.tutte() };
    salvaFile(`studio-amico-backup-${dati.esportato.slice(0, 10)}.json`, JSON.stringify(dati));
  };
  $("#ripristina").onchange = async (e) => {
    try {
      const dati = JSON.parse(await e.target.files[0].text());
      if (dati.app !== "studio-amico" || !Array.isArray(dati.schede)) throw new Error();
      let n = 0;
      for (const s of dati.schede) {
        if (typeof s?.id === "string" && typeof s.creata === "string" && typeof s.titolo === "string") {
          const id = s.id.startsWith("s_") ? s.id : "s_" + s.id.replace(/[^\w-]/g, "");
          await archivio.salva({ ...normalizzaScheda(s), ...pick(s), id });
          n++;
        }
      }
      toast(t("ripristinate").replace("{n}", n));
    } catch {
      toast(t("fileNonValido"));
    }
  };
  $("#cancella").onclick = async () => {
    if (!(await chiedi(t("confermaCancellaTutto")))) return;
    await archivio.svuota();
    cancellaPref();
    vai("nuova");
  };
  app.onclick = null;
}

// Metadati da conservare nel ripristino (il contenuto passa da normalizzaScheda).
function pick(s) {
  return {
    tipo: s.tipo === "ripasso" ? "ripasso" : "scheda",
    modalita: s.modalita,
    materia: ELENCO_MATERIE.some(([m]) => m === s.materia) ? s.materia : "altro",
    lingua: str(s.lingua),
    creata: s.creata,
    sessioni: arr(s.sessioni),
    esiti: s.esiti && typeof s.esiti === "object" ? s.esiti : {},
    test: arr(s.test),
  };
}

// ---------- router ----------
function render() {
  app.onclick = app.onchange = null;
  window.scrollTo(0, 0);
  document.querySelectorAll(".tabbar [data-vai]").forEach((b) => b.classList.toggle("attivo", b.dataset.vai === stato.vista));
  if (stato.vista === "privacy") return vistaPrivacy();
  if (!pref("consenso")) return vistaBenvenuto();
  switch (stato.vista) {
    case "scheda": return vistaScheda(stato.id);
    case "archivio": return vistaArchivio();
    case "ripasso": return vistaRipasso();
    case "impostazioni": return vistaImpostazioni();
    default: return vistaNuova();
  }
}

document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-vai]");
  if (b) vai(b.dataset.vai);
});
applicaTraduzioni();
render();
