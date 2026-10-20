import { MATERIE, LIVELLI, LINGUE } from "./pedagogia.js";

export class InputError extends Error {}

const MAX_IMMAGINI = 8;
const MAX_IMG_BYTES = 3 * 1024 * 1024; // dopo la decodifica base64
const MAX_SCHEDE_RIPASSO = 12;
const TIPI_IMG = new Set(["image/jpeg", "image/png", "image/webp"]);

const testo = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

function scelta(v, ammessi, def) {
  return Object.hasOwn(ammessi, v) ? v : def;
}

export function contestoBase(body) {
  return {
    materia: scelta(body.materia, MATERIE, "altro"),
    livello: scelta(body.livello, LIVELLI, "media2"),
    lingua: scelta(body.lingua, LINGUE, "it"),
  };
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

export function scheda(body) {
  return {
    ...contestoBase(body),
    energia: ["poca", "media", "tanta"].includes(body.energia) ? body.energia : "media",
    immagini: immagini(body.immagini),
    note: testo(body.note, 500),
  };
}

export function ripasso(body) {
  if (!Array.isArray(body.schede) || body.schede.length < 1 || body.schede.length > MAX_SCHEDE_RIPASSO) {
    throw new InputError(`Seleziona da 1 a ${MAX_SCHEDE_RIPASSO} schede.`);
  }
  // Solo i campi di contenuto: niente metadati personali (umore, date) verso l'API.
  const schede = body.schede.map((s) => ({
    titolo: testo(s?.titolo, 300),
    abstract: testo(s?.abstract, 3000),
    schema: Array.isArray(s?.schema) ? s.schema.slice(0, 30) : [],
    concetti_chiave: Array.isArray(s?.concetti_chiave) ? s.concetti_chiave.slice(0, 30) : [],
    domande: Array.isArray(s?.domande) ? s.domande.slice(0, 20).map((d) => ({ domanda: testo(d?.domanda, 500) })) : [],
  }));
  return {
    ...contestoBase(body),
    modalita: ["riassunto", "orale", "scritto"].includes(body.modalita) ? body.modalita : "riassunto",
    schede,
  };
}

export function verifica(body) {
  return {
    ...contestoBase(body),
    esercizio: { consegna: testo(body.esercizio?.consegna, 2000) },
    contestoScheda: testo(body.contestoScheda, 2000),
    immagini: immagini(body.immagini),
  };
}

// Controllo qualità sull'output del modello.
export function controllaScheda(s) {
  if (!Array.isArray(s.vero_falso) || s.vero_falso.length !== 10) {
    s.avvisi = [...(s.avvisi ?? []), `Il test contiene ${s.vero_falso?.length ?? 0} domande invece di 10.`];
  }
  return s;
}
