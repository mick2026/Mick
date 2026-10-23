import { MATERIE, LIVELLI, LINGUE } from "./pedagogia.js";

export class InputError extends Error {}

const MAX_IMMAGINI = 8;
const MAX_IMG_BYTES = 3 * 1024 * 1024; // dopo la decodifica base64
const MAX_SCHEDE_RIPASSO = 12;
const TIPI_IMG = new Set(["image/jpeg", "image/png", "image/webp"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const testo = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const scelta = (v, ammessi, def) => (Object.hasOwn(ammessi, v) ? v : def);
const tra = (v, ammessi) => (ammessi.includes(v) ? v : null);

export function uuid(v) {
  if (typeof v !== "string" || !UUID.test(v)) throw new InputError("Identificativo non valido.");
  return v.toLowerCase();
}

export function email(v) {
  const e = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new InputError("Indirizzo email non valido.");
  return e;
}

export function codice(v) {
  const c = typeof v === "string" ? v.replace(/\s/g, "") : "";
  if (!/^\d{6,10}$/.test(c)) throw new InputError("Il codice è fatto di sole cifre.");
  return c;
}

export function profilo(body, parziale = false) {
  const out = {};
  if (!parziale || body.nome !== undefined) {
    // Solo un soprannome: niente cognomi o altri dati (minimizzazione).
    const nome = testo(body.nome, 40).replace(/[\u0000-\u001f\u007f<>]/g, "").trim();
    if (!nome) throw new InputError("Scrivi un nome o un soprannome.");
    out.nome = nome;
  }
  if (!parziale || body.livello !== undefined) out.livello = scelta(body.livello, LIVELLI, "media2");
  if (!parziale || body.lingua !== undefined) out.lingua = scelta(body.lingua, LINGUE, "it");
  return out;
}

export function immagini(list, min = 1) {
  if (!Array.isArray(list) || list.length < min || list.length > MAX_IMMAGINI) {
    throw new InputError(`Servono da ${min} a ${MAX_IMMAGINI} immagini.`);
  }
  return list.map((img) => {
    if (!img || !TIPI_IMG.has(img.mediaType) || typeof img.data !== "string" || !/^[A-Za-z0-9+/=]+$/.test(img.data)) {
      throw new InputError("Formato immagine non valido.");
    }
    if (Math.floor((img.data.length * 3) / 4) > MAX_IMG_BYTES) throw new InputError("Immagine troppo grande.");
    return { mediaType: img.mediaType, data: img.data };
  });
}

export function nuovaScheda(body) {
  return {
    profilo: uuid(body.profilo),
    materia: scelta(body.materia, MATERIE, "altro"),
    energia: tra(body.energia, ["poca", "media", "tanta"]) ?? "media",
    note: testo(body.note, 500),
    immagini: immagini(body.immagini),
  };
}

export function ripasso(body) {
  if (!Array.isArray(body.schede) || body.schede.length < 1 || body.schede.length > MAX_SCHEDE_RIPASSO) {
    throw new InputError(`Seleziona da 1 a ${MAX_SCHEDE_RIPASSO} schede.`);
  }
  return {
    profilo: uuid(body.profilo),
    ids: [...new Set(body.schede.map(uuid))],
    modalita: tra(body.modalita, ["riassunto", "orale", "scritto"]) ?? "riassunto",
  };
}

export function verifica(body) {
  const esercizio = Number(body.esercizio);
  if (!Number.isInteger(esercizio) || esercizio < 0 || esercizio > 50) throw new InputError("Esercizio non valido.");
  return { scheda: uuid(body.scheda), esercizio, immagini: immagini(body.immagini, 1).slice(0, 4) };
}

const dataIso = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : new Date().toISOString());

// Il telefono può aggiornare solo l'umore delle sessioni e i risultati del test.
// Gli esiti degli esercizi (e le soluzioni) li scrive solo il server.
export function aggiornaScheda(body) {
  const out = {};
  if (Array.isArray(body.sessioni)) {
    out.sessioni = body.sessioni.slice(-200).map((s) => ({
      data: dataIso(s?.data),
      inizio: tra(s?.inizio, ["poca", "media", "tanta"]),
      fine: tra(s?.fine, ["fatica", "bene", "top"]),
    }));
  }
  if (Array.isArray(body.test)) {
    out.test = body.test.slice(-200).map((x) => {
      const tot = Math.max(1, Math.min(10, Number.parseInt(x?.tot, 10) || 10));
      return { data: dataIso(x?.data), ok: Math.max(0, Math.min(tot, Number.parseInt(x?.ok, 10) || 0)), tot };
    });
  }
  if (!Object.keys(out).length) throw new InputError("Niente da aggiornare.");
  return out;
}

// Controllo qualità sull'output del modello.
export function controllaScheda(s) {
  if (!Array.isArray(s.vero_falso) || s.vero_falso.length !== 10) {
    s.avvisi = [...(s.avvisi ?? []), `Il test contiene ${s.vero_falso?.length ?? 0} domande invece di 10.`];
  }
  return s;
}

export function piano(body) {
  const piano = tra(body.piano, ["prova", "abbonato"]);
  if (!piano) throw new InputError("Piano non valido.");
  let scade = null;
  if (body.abbonamento_scade) {
    if (typeof body.abbonamento_scade !== "string" || Number.isNaN(Date.parse(body.abbonamento_scade))) throw new InputError("Data di scadenza non valida.");
    scade = new Date(body.abbonamento_scade).toISOString();
  }
  return { piano, abbonamento_scade: piano === "abbonato" ? scade : null };
}
