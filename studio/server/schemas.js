// Schemi JSON per gli output strutturati di Claude.
// Nota: niente minLength/minItems ecc. (non supportati): i conteggi si controllano in validate.js.

const str = { type: "string" };
const strArr = { type: "array", items: str };

const obj = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

// Gli esercizi NON contengono la soluzione: viene generata solo dopo un tentativo serio.
const esercizio = obj({
  consegna: str,
  difficolta: { type: "string", enum: ["base", "medio", "avanzato"] },
  suggerimento: str,
});

export const SCHEDA_SCHEMA = obj({
  titolo: str,
  abstract: str,
  schema: {
    type: "array",
    items: obj({
      titolo: str,
      punti: strArr,
      sotto: { type: "array", items: obj({ titolo: str, punti: strArr }) },
    }),
  },
  concetti_chiave: { type: "array", items: obj({ termine: str, definizione: str }) },
  esercizi: { type: "array", items: esercizio },
  domande: {
    type: "array",
    items: obj({
      domanda: str,
      tipo: { type: "string", enum: ["comprensione", "ragionamento", "collegamento"] },
      traccia_risposta: str,
    }),
  },
  vero_falso: {
    type: "array",
    items: obj({ affermazione: str, vero: { type: "boolean" }, spiegazione: str }),
  },
  vita_reale: { type: "array", items: obj({ titolo: str, descrizione: str }) },
  piano_ripasso: { type: "array", items: obj({ quando: str, attivita: str }) },
  consiglio_metodo: str,
  avvisi: strArr,
});

export const VERIFICA_SCHEMA = obj({
  tentativo_serio: { type: "boolean" },
  motivazione: str,
  feedback_sul_tentativo: str,
  soluzione_guidata: str,
});
