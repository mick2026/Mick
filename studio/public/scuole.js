// Tipi di scuola italiani e materie per anno, dai quadri orari ministeriali (indicazioni nazionali e
// linee guida di licei, tecnici e professionali). È una PROPOSTA di partenza: ogni famiglia può
// togliere, aggiungere o rinominare le materie. Scienze motorie e Religione sono omesse perché di
// rado servono schede di studio: si aggiungono a mano se servono.
// "area" collega la materia alle linee guida didattiche (server/pedagogia.js).

// [nome, emoji, area, primo anno, ultimo anno]
const m = (nome, emoji, area, da = 1, a = 5) => ({ nome, emoji, area, da, a });

const ITA = m("Lingua e letteratura italiana", "📖", "italiano");
const ING = m("Lingua e cultura inglese", "🗣️", "inglese");
const STGEO = m("Storia e geografia", "🏛️", "storia", 1, 2);
const STO35 = m("Storia", "🏛️", "storia", 3, 5);
const FIL = m("Filosofia", "🤔", "filosofia", 3, 5);
const MAT = m("Matematica", "➗", "matematica");
const SCN = m("Scienze naturali", "🔬", "scienze");
const CIV = m("Educazione civica", "⚖️", "educazione_civica");

// Biennio comune degli istituti tecnici e professionali.
const BIENNIO_TECNICO = [
  m("Lingua e letteratura italiana", "📖", "italiano"),
  m("Lingua inglese", "🗣️", "inglese"),
  m("Storia", "🏛️", "storia"),
  m("Matematica", "➗", "matematica"),
  m("Diritto ed economia", "⚖️", "diritto_economia", 1, 2),
  m("Scienze integrate (Scienze della Terra e Biologia)", "🔬", "scienze", 1, 2),
  CIV,
];

export const SCUOLE = {
  primaria: {
    nome: "Scuola primaria", livelli: ["primaria"],
    materie: [
      m("Italiano", "📖", "italiano"), m("Matematica", "➗", "matematica"), m("Storia", "🏛️", "storia"),
      m("Geografia", "🌍", "geografia"), m("Scienze", "🔬", "scienze"), m("Inglese", "🗣️", "inglese"),
      m("Tecnologia", "💻", "informatica"), m("Musica", "🎵", "musica"), m("Arte e immagine", "🎨", "arte"), CIV,
    ],
  },
  media: {
    nome: "Scuola secondaria di primo grado", livelli: ["media1", "media2", "media3"],
    materie: [
      m("Italiano", "📖", "italiano"), m("Storia", "🏛️", "storia"), m("Geografia", "🌍", "geografia"),
      m("Matematica", "➗", "matematica"), m("Scienze", "🔬", "scienze"), m("Inglese", "🗣️", "inglese"),
      m("Seconda lingua comunitaria", "🗣️", "inglese"), m("Tecnologia", "💻", "informatica"),
      m("Musica", "🎵", "musica"), m("Arte e immagine", "🎨", "arte"), CIV,
    ],
  },
  liceo_scientifico: {
    nome: "Liceo scientifico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, m("Lingua e cultura latina", "🏺", "latino_greco"), ING, STGEO, STO35, FIL, MAT,
      m("Fisica", "🧲", "fisica"), SCN, m("Disegno e storia dell'arte", "🎨", "arte"), CIV],
  },
  liceo_scienze_applicate: {
    nome: "Liceo scientifico – scienze applicate", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, ING, STGEO, STO35, FIL, MAT, m("Informatica", "💻", "informatica"), m("Fisica", "🧲", "fisica"),
      SCN, m("Disegno e storia dell'arte", "🎨", "arte"), CIV],
  },
  liceo_classico: {
    nome: "Liceo classico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, m("Lingua e cultura latina", "🏺", "latino_greco"), m("Lingua e cultura greca", "🏺", "latino_greco"),
      ING, STGEO, STO35, FIL, MAT, m("Fisica", "🧲", "fisica", 3, 5), SCN, m("Storia dell'arte", "🎨", "arte", 3, 5), CIV],
  },
  liceo_linguistico: {
    nome: "Liceo linguistico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, m("Lingua latina", "🏺", "latino_greco", 1, 2), m("Lingua e cultura straniera 1", "🗣️", "inglese"),
      m("Lingua e cultura straniera 2", "🗣️", "inglese"), m("Lingua e cultura straniera 3", "🗣️", "inglese"),
      STGEO, STO35, FIL, MAT, m("Fisica", "🧲", "fisica", 3, 5), SCN, m("Storia dell'arte", "🎨", "arte", 3, 5), CIV],
  },
  liceo_scienze_umane: {
    nome: "Liceo delle scienze umane", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, m("Lingua e cultura latina", "🏺", "latino_greco"), STGEO, STO35, FIL,
      m("Scienze umane", "🧠", "scienze_umane"), m("Diritto ed economia", "⚖️", "diritto_economia", 1, 2), ING, MAT,
      m("Fisica", "🧲", "fisica", 3, 5), SCN, m("Storia dell'arte", "🎨", "arte", 3, 5), CIV],
  },
  liceo_artistico: {
    nome: "Liceo artistico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, ING, STGEO, STO35, FIL, MAT, m("Fisica", "🧲", "fisica", 3, 5), m("Scienze naturali", "🔬", "scienze", 1, 2),
      m("Chimica", "🔬", "scienze", 3, 4), m("Storia dell'arte", "🎨", "arte"),
      m("Discipline grafiche e pittoriche", "🎨", "arte", 1, 2), m("Discipline geometriche", "📐", "arte", 1, 2),
      m("Discipline plastiche e scultoree", "🎨", "arte", 1, 2), m("Discipline d'indirizzo", "🎨", "arte", 3, 5), CIV],
  },
  liceo_musicale: {
    nome: "Liceo musicale e coreutico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [ITA, ING, STGEO, STO35, FIL, MAT, m("Fisica", "🧲", "fisica", 3, 5), m("Scienze naturali", "🔬", "scienze", 1, 2),
      m("Storia dell'arte", "🎨", "arte"), m("Storia della musica", "🎵", "musica"),
      m("Teoria, analisi e composizione", "🎵", "musica"), m("Tecnologie musicali", "🎵", "musica"), CIV],
  },
  tecnico_economico: {
    nome: "Istituto tecnico – settore economico (AFM)", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [...BIENNIO_TECNICO, m("Seconda lingua comunitaria", "🗣️", "inglese"),
      m("Scienze integrate (Fisica)", "🧲", "fisica", 1, 1), m("Scienze integrate (Chimica)", "🔬", "scienze", 2, 2),
      m("Geografia", "🌍", "geografia", 1, 2), m("Informatica", "💻", "informatica", 1, 4),
      m("Economia aziendale", "📊", "diritto_economia"), m("Diritto", "⚖️", "diritto_economia", 3, 5),
      m("Economia politica", "📊", "diritto_economia", 3, 5)],
  },
  tecnico_tecnologico: {
    nome: "Istituto tecnico – settore tecnologico", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [...BIENNIO_TECNICO, m("Scienze integrate (Fisica)", "🧲", "fisica", 1, 2),
      m("Scienze integrate (Chimica)", "🔬", "scienze", 1, 2),
      m("Tecnologie e tecniche di rappresentazione grafica", "📐", "arte", 1, 2),
      m("Tecnologie informatiche", "💻", "informatica", 1, 1), m("Scienze e tecnologie applicate", "🛠️", "informatica", 2, 2),
      m("Geografia", "🌍", "geografia", 1, 1), m("Complementi di matematica", "➗", "matematica", 3, 4)],
  },
  tecnico_informatica: {
    nome: "Istituto tecnico – informatica e telecomunicazioni", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [...BIENNIO_TECNICO, m("Scienze integrate (Fisica)", "🧲", "fisica", 1, 2),
      m("Scienze integrate (Chimica)", "🔬", "scienze", 1, 2),
      m("Tecnologie e tecniche di rappresentazione grafica", "📐", "arte", 1, 2),
      m("Tecnologie informatiche", "💻", "informatica", 1, 1), m("Scienze e tecnologie applicate", "🛠️", "informatica", 2, 2),
      m("Geografia", "🌍", "geografia", 1, 1), m("Complementi di matematica", "➗", "matematica", 3, 4),
      m("Informatica", "💻", "informatica", 3, 5), m("Sistemi e reti", "🌐", "informatica", 3, 5),
      m("Tecnologie e progettazione di sistemi informatici e di telecomunicazioni", "💻", "informatica", 3, 5),
      m("Telecomunicazioni", "📡", "informatica", 3, 4), m("Gestione progetto e organizzazione d'impresa", "📊", "diritto_economia", 5, 5)],
  },
  professionale: {
    nome: "Istituto professionale", livelli: ["sup1", "sup2", "sup3", "sup4", "sup5"],
    materie: [...BIENNIO_TECNICO, m("Geografia", "🌍", "geografia", 1, 2)],
  },
};

// Anno di corso dal livello del profilo (primaria conta come un unico anno).
export function annoDi(livello) {
  const n = Number(String(livello).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export const slug = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "materia";

// Materie proposte per tipo di scuola e classe, nel formato salvato nel profilo.
export function materieProposte(scuola, livello) {
  const s = SCUOLE[scuola];
  if (!s) return [];
  const anno = annoDi(livello);
  const visti = new Set();
  return s.materie
    .filter((x) => anno >= x.da && anno <= x.a)
    .map(({ nome, emoji, area }) => ({ id: slug(nome), nome, emoji, area }))
    .filter((x) => !visti.has(x.id) && visti.add(x.id));
}
