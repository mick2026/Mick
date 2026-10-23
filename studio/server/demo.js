// Modalità DEMO (DEMO=1): risposte finte per provare l'interfaccia senza chiave API.

const vf = [
  ["La fotosintesi avviene nei cloroplasti.", true],
  ["Le piante producono anidride carbonica durante la fotosintesi.", false],
  ["La clorofilla assorbe soprattutto la luce verde.", false],
  ["Il glucosio è uno dei prodotti della fotosintesi.", true],
  ["L'acqua entra nella pianta soprattutto dalle radici.", true],
  ["La fotosintesi può avvenire senza luce in tutte le sue fasi.", false],
  ["L'ossigeno liberato proviene dalla scissione dell'acqua.", true],
  ["Gli stomi servono agli scambi di gas.", true],
  ["Gli animali fanno la fotosintesi.", false],
  ["Senza fotosintesi l'atmosfera avrebbe molto meno ossigeno.", true],
];

export const schedaDemo = (titolo = "La fotosintesi (demo)") => ({
  titolo,
  abstract:
    "La fotosintesi è il processo con cui le piante usano la luce del Sole per trasformare acqua e anidride carbonica in glucosio, liberando ossigeno. Avviene nei cloroplasti grazie alla clorofilla ed è alla base di quasi tutte le catene alimentari.",
  schema: [
    { titolo: "Ingredienti", punti: ["Luce", "Acqua (dalle radici)", "Anidride carbonica (dagli stomi)"], sotto: [] },
    {
      titolo: "Dove e come",
      punti: ["Nei cloroplasti", "Grazie alla clorofilla"],
      sotto: [
        { titolo: "Fase luminosa", punti: ["Serve la luce", "Si libera ossigeno"] },
        { titolo: "Fase oscura", punti: ["Non serve luce diretta", "Si forma glucosio"] },
      ],
    },
    { titolo: "Prodotti", punti: ["Glucosio", "Ossigeno"], sotto: [] },
  ],
  concetti_chiave: [
    { termine: "Clorofilla", definizione: "Pigmento verde che cattura l'energia della luce." },
    { termine: "Stomi", definizione: "Piccole aperture delle foglie per gli scambi di gas." },
  ],
  esercizi: [
    { consegna: "Scrivi l'equazione della fotosintesi con le parole (reagenti → prodotti).", difficolta: "base", suggerimento: "Parti da cosa entra nella foglia e cosa esce." },
    { consegna: "Disegna una foglia e indica con frecce ingressi e uscite di sostanze.", difficolta: "medio", suggerimento: "Pensa a radici, stomi e luce." },
    { consegna: "Perché una pianta tenuta al buio per giorni ingiallisce? Spiega con i concetti studiati.", difficolta: "avanzato", suggerimento: "Cosa manca e quale fase non può avvenire?" },
  ],
  domande: [
    { domanda: "Che cos'è la fotosintesi?", tipo: "comprensione", traccia_risposta: "Processo, luce, acqua + CO2, glucosio + ossigeno." },
    { domanda: "Perché la fotosintesi è importante anche per gli animali?", tipo: "collegamento", traccia_risposta: "Ossigeno, base delle catene alimentari." },
  ],
  vero_falso: vf.map(([affermazione, vero]) => ({
    affermazione,
    vero,
    spiegazione: vero ? "Esatto." : "È falso: rileggi lo schema per la versione corretta.",
  })),
  vita_reale: [
    { titolo: "Piante in casa", descrizione: "Perché le piante d'appartamento vanno vicino alla finestra." },
    { titolo: "Il cibo che mangi", descrizione: "Pane e pasta vengono da piante che hanno fatto fotosintesi." },
  ],
  piano_ripasso: [
    { quando: "Domani", attivita: "Ridisegna lo schema a memoria, poi confronta." },
    { quando: "Tra 3 giorni", attivita: "Rifai il test vero/falso." },
    { quando: "Tra una settimana", attivita: "Spiega l'argomento ad alta voce in 2 minuti." },
  ],
  consiglio_metodo: "Prova a spiegare la fotosintesi a qualcuno di casa senza guardare gli appunti.",
  avvisi: ["Modalità DEMO: contenuto di esempio, non generato dalle tue foto."],
});

export const verificaDemo = () => ({
  tentativo_serio: true,
  motivazione: "(DEMO) Si vede un lavoro reale sull'esercizio.",
  feedback_sul_tentativo: "(DEMO) Buona strategia: sei partito dagli ingredienti. Controlla i prodotti.",
  soluzione_guidata: "(DEMO) 1. Reagenti: acqua + anidride carbonica + luce. 2. Prodotti: glucosio + ossigeno.",
});
