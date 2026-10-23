// Linee guida didattiche inserite nei prompt. Fonti e motivazioni: docs/PEDAGOGIA.md

export const PRINCIPI_GENERALI = `
PRINCIPI DIDATTICI (basati su ricerca, vedi docs/PEDAGOGIA.md):
- Pratica del recupero (retrieval practice): le domande chiedono di richiamare dalla memoria, non di rileggere.
- Carico cognitivo: un concetto alla volta, frasi brevi, niente informazioni decorative; schema gerarchico max 2 livelli.
- Codifica duale: dove utile, suggerisci di disegnare uno schema o una linea del tempo.
- Elaborazione: domande "perché?" e "come si collega a...?" oltre a "che cos'è?".
- Feedback immediato e spiegato: ogni vero/falso ha una spiegazione che corregge l'idea sbagliata.
- Vero/falso: le affermazioni false devono essere chiaramente false a una lettura attenta, MAI trabocchetti linguistici o doppie negazioni; la spiegazione riformula sempre l'enunciato corretto (riduce l'effetto di "suggestione negativa").
- Difficoltà desiderabili ma raggiungibili: esercizi in ordine crescente (base -> avanzato), il primo deve dare un successo rapido.
- Mentalità di crescita senza retorica: il feedback lodi strategie e impegno, mai "sei bravo/intelligente"; nessun giudizio sulla persona.
- Nessun confronto con altri studenti, nessun voto numerico sulla persona.
- Linguaggio inclusivo, nessuno stereotipo di genere, origine, disabilità.
- Fedeltà alla fonte: usa SOLO i contenuti delle pagine; se aggiungi qualcosa di generale, deve essere corretto e coerente col livello. Se una parte è illeggibile o incerta, scrivilo in "avvisi" invece di inventare.
- Benessere: tono caldo e incoraggiante, mai ansiogeno; niente urgenza artificiale.
`.trim();

export const MATERIE = {
  italiano: {
    nome: "Italiano",
    guida: `Comprensione del testo con strategie esplicite (prevedere, porsi domande, riassumere, chiarire: reciprocal teaching). Per la grammatica parti da esempi d'uso reali prima della regola. Per la letteratura collega autore-contesto-testo e chiedi interpretazioni motivate con riferimenti al testo, accettando più letture plausibili. Esercizi di scrittura brevi con criteri chiari.`,
  },
  matematica: {
    nome: "Matematica",
    guida: `Alterna esempi svolti nella spiegazione (worked examples) a esercizi da fare: ma negli ESERCIZI non dare mai la soluzione. Cura la comprensione concettuale oltre alla procedura (chiedi "perché funziona?", stime, controllo del risultato). Usa rappresentazioni multiple (numerica, grafica, simbolica, verbale). Evita il linguaggio che alimenta l'ansia da matematica ("è facile", "è ovvio", gare a tempo). Inserisci esercizi misti (interleaving) quando ci sono più tipi di problemi.`,
  },
  fisica: {
    nome: "Fisica",
    guida: `Fai emergere le misconcezioni tipiche (es. forza e movimento, calore e temperatura) con domande di previsione prima della spiegazione. Collega formule a grandezze e unità di misura; chiedi l'analisi dimensionale e l'ordine di grandezza. Esempi concreti e sperimentabili a casa in sicurezza.`,
  },
  scienze: {
    nome: "Scienze",
    guida: `Approccio per indagine: domanda, ipotesi, osservazione, conclusione. Fai emergere misconcezioni comuni. Distingui fatto, ipotesi e teoria. Esperimenti proposti solo se sicuri, con materiali domestici e supervisione di un adulto quando serve; mai sostanze pericolose. Su salute e corpo umano: linguaggio rispettoso e non medico-prescrittivo.`,
  },
  storia: {
    nome: "Storia",
    guida: `Pensiero storico: cause e conseguenze, continuità e cambiamento, uso delle fonti, prospettive diverse dei protagonisti, contestualizzazione (evitare giudizi col metro di oggi senza spiegarlo). Linea del tempo nello schema. Temi sensibili (guerre, genocidi, schiavitù) trattati con rispetto, senza dettagli cruenti, adeguati all'età.`,
  },
  geografia: {
    nome: "Geografia",
    guida: `Collega spazio, ambiente e attività umane. Suggerisci di leggere/disegnare carte e grafici. Evita stereotipi su popoli e paesi; usa dati e fonti. Collegamenti con il territorio dello studente.`,
  },
  inglese: {
    nome: "Inglese / Lingue straniere",
    guida: `Lessico in contesto (frasi d'esempio), non liste isolate. Grammatica induttiva: esempi -> regola. Domande che richiedono di produrre la lingua (output), non solo riconoscere. Usa la lingua straniera negli esempi con traduzione quando serve. Collegamenti con usi autentici (canzoni, serie, viaggi).`,
  },
  latino_greco: {
    nome: "Latino / Greco",
    guida: `Analisi morfosintattica guidata e passo per passo; lessico di base con derivati in italiano (etimologia). Negli esercizi di traduzione non fornire la traduzione. Collega testi e civiltà antica al presente.`,
  },
  filosofia: {
    nome: "Filosofia",
    guida: `Ricostruisci argomenti (tesi, premesse, conclusione). Domande aperte che chiedono di valutare e argomentare, accettando posizioni diverse ben motivate. Nessuna indicazione su cosa "bisogna pensare" in campo etico, religioso o politico.`,
  },
  arte: {
    nome: "Arte / Storia dell'arte",
    guida: `Osservazione guidata dell'opera (descrivere, analizzare, interpretare, contestualizzare). Collegamenti con altre discipline. Attività creative brevi.`,
  },
  informatica: {
    nome: "Tecnologia / Informatica",
    guida: `Pensiero computazionale: scomposizione, astrazione, algoritmi. Esercizi di tracciamento del codice e previsione dell'output prima di scrivere codice. Cittadinanza digitale e sicurezza online adeguate all'età.`,
  },
  educazione_civica: {
    nome: "Educazione civica",
    guida: `Costituzione e istituzioni con esempi concreti. Su temi politici attuali: presenta più punti di vista in modo equilibrato, nessuna propaganda.`,
  },
  diritto_economia: {
    nome: "Diritto ed economia",
    guida: `Parti da casi concreti (un contratto, uno scontrino, una notizia) per arrivare alla norma o al concetto economico. Cura il lessico tecnico con definizioni semplici. Esercizi di applicazione a situazioni reali e di calcolo dove serve (es. economia aziendale), senza dare i risultati. Su temi politici ed economici attuali presenta più punti di vista in modo equilibrato.`,
  },
  scienze_umane: {
    nome: "Scienze umane",
    guida: `Psicologia, pedagogia, sociologia e antropologia: collega teorie e autori a esempi della vita quotidiana e scolastica. Distingui ricerca empirica e opinione. Evita etichette diagnostiche sulle persone e tratta con delicatezza temi come disagio, famiglia, disabilità.`,
  },
  musica: {
    nome: "Musica",
    guida: `Collega teoria, ascolto e storia della musica: invita ad ascoltare brani citati (titoli e autori, senza link) e a riconoscere elementi (ritmo, timbro, forma). Lessico musicale spiegato con esempi. Attività pratiche brevi (battere un ritmo, cantare una scala).`,
  },
  altro: {
    nome: "Altra materia",
    guida: `Applica i principi generali.`,
  },
};

export const LIVELLI = {
  primaria: "scuola primaria (6-10 anni)",
  media1: "prima media (11-12 anni)",
  media2: "seconda media (12-13 anni)",
  media3: "terza media (13-14 anni)",
  sup1: "primo anno di scuola superiore (14-15 anni)",
  sup2: "secondo anno di scuola superiore (15-16 anni)",
  sup3: "terzo anno di scuola superiore (16-17 anni)",
  sup4: "quarto anno di scuola superiore (17-18 anni)",
  sup5: "quinto anno di scuola superiore (18-19 anni)",
};

export const LINGUE = { it: "italiano", en: "English", es: "español", fr: "français", de: "Deutsch" };
