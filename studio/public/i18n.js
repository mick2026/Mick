// Traduzioni dell'interfaccia. Per aggiungere una lingua: copia il blocco "it", traduci, aggiungi a LINGUE_UI.
import { pref } from "./db.js";

export const LINGUE_UI = { it: "Italiano", en: "English" };

const MATERIE_IT = {
  materia_italiano: "Italiano", materia_matematica: "Matematica", materia_fisica: "Fisica", materia_scienze: "Scienze",
  materia_storia: "Storia", materia_geografia: "Geografia", materia_inglese: "Inglese / Lingue", materia_latino_greco: "Latino / Greco",
  materia_filosofia: "Filosofia", materia_arte: "Arte", materia_informatica: "Tecnologia / Informatica",
  materia_educazione_civica: "Educazione civica", materia_altro: "Altro",
};
const MATERIE_EN = {
  materia_italiano: "Italian", materia_matematica: "Maths", materia_fisica: "Physics", materia_scienze: "Science",
  materia_storia: "History", materia_geografia: "Geography", materia_inglese: "English / Languages", materia_latino_greco: "Latin / Greek",
  materia_filosofia: "Philosophy", materia_arte: "Art", materia_informatica: "Technology / Computing",
  materia_educazione_civica: "Civics", materia_altro: "Other",
};

export const DIZ = {
  it: {
    ...MATERIE_IT,
    nav_nuova: "Nuova", nav_archivio: "Archivio", nav_ripasso: "Ripasso", nav_impostazioni: "Impostazioni", demo: "DEMO",
    erroreGenerico: "Qualcosa è andato storto, riprova.",
    car1: "Sto leggendo le tue pagine… 👀", car2: "Metto in ordine le idee… 🧩", car3: "Preparo esercizi e domande… ✏️",
    car4: "Invento il test vero/falso… ✅", car5: "Cerco collegamenti con la vita reale… 🌱",
    benvenuto: "Ciao! Sono Studio Amico", benvenutoTesto: "Fotografa le pagine da studiare e ti preparo una scheda con riassunto, schema, esercizi, domande e un test.",
    priv1: "Le tue schede restano solo su questo dispositivo.",
    priv2: "Le foto vengono inviate all'intelligenza artificiale solo per creare la scheda e non vengono conservate dall'app.",
    priv3: "Non fotografare volti, nomi o dati personali.",
    priv4: "Puoi cancellare tutto quando vuoi dalle Impostazioni.",
    consensoGenitore: "Sono un genitore/tutore, oppure ho almeno 14 anni e un genitore è d'accordo che io usi l'app.",
    iniziamo: "Iniziamo!", leggiPrivacy: "Privacy e sicurezza", indietro: "Indietro",
    privacyTitolo: "Privacy e sicurezza",
    privacyTesto: `<p><strong>Cosa resta sul dispositivo:</strong> schede, risultati dei test, umore di inizio e fine studio. Nessun account, nessun dato su server dell'app.</p>
      <p><strong>Cosa viene inviato:</strong> le foto delle pagine (ridimensionate e senza metadati come la posizione GPS) e le schede scelte per il ripasso vengono inviate al servizio di intelligenza artificiale Anthropic (Claude) solo per generare il contenuto. L'umore e le date non vengono inviati.</p>
      <p><strong>Foto dei tentativi:</strong> servono solo per controllare l'esercizio; l'app conserva solo il commento, non la foto.</p>
      <p><strong>Contenuti generati da IA:</strong> possono contenere errori. Controlla sempre con il libro e con l'insegnante.</p>
      <p><strong>Cancellazione:</strong> Impostazioni → "Cancella tutti i dati".</p>`,
    quantaVoglia: "Quanta voglia hai oggi?", energia_poca: "Pochina", energia_media: "Normale", energia_tanta: "Tantissima",
    notaUmore: "Nessuna risposta è sbagliata: serve a preparare una scheda su misura.",
    energiaRisposta_poca: "Ci sta! Facciamo una scheda leggera, un passo alla volta 🐢",
    energiaRisposta_media: "Perfetto, si parte! 🙂", energiaRisposta_tanta: "Wow, che energia! Ti metto anche una sfida 🚀",
    sceltaMateria: "Che materia studiamo?", cambia: "cambia",
    fotografa: "Fotografa pagine e appunti", fotografaTesto: "Una foto per pagina, ben illuminata e dritta.",
    scatta: "Scatta foto", galleria: "Dalla galleria", pagina: "Pagina", rimuovi: "Rimuovi",
    contaFoto: "{n} foto su {max}", avvisoFoto: "Niente volti o dati personali, grazie.",
    noteFacoltative: "Note (facoltative)", notePlaceholder: "Es. «la prof chiede soprattutto le date»",
    creaScheda: "Crea la scheda", maxFoto: "Massimo 8 foto.", fotoNonLeggibile: "Non riesco a leggere questa foto.",
    archivio: "Archivio", stampa: "Stampa / PDF", esporta: "Esporta HTML", elimina: "Elimina", sezioni: "Sezioni",
    nav_abstract: "Abstract", nav_schema: "Schema", nav_concetti: "Concetti", nav_esercizi: "Esercizi", nav_domande: "Domande",
    nav_vf: "Test", nav_vita: "Vita reale", nav_piano: "Ripasso",
    comeEAndata: "Com'è andata?", fine_fatica: "Faticoso", fine_bene: "Bene", fine_top: "Alla grande",
    fineRisposta_fatica: "Grazie della sincerità. La fatica di oggi è memoria domani 💪",
    fineRisposta_bene: "Bel lavoro, alla prossima! 🙂", fineRisposta_top: "Grande! Ricordati il ripasso nei prossimi giorni 🤩",
    confermaElimina: "Eliminare questa scheda?",
    controlloTentativo: "Sto guardando il tuo tentativo…",
    tentativoOk: "Tentativo ricevuto: ecco la soluzione guidata!", tentativoNo: "Prova ancora: serve un tentativo vero per sbloccare la soluzione.",
    abstract: "In breve", schema: "Schema degli argomenti", concetti: "Concetti chiave", esercizi: "Esercizi", domande: "Domande",
    testVF: "Test: 10 vero o falso", vitaReale: "Nella vita reale", pianoRipasso: "Piano di ripasso", consiglioMetodo: "Consiglio di metodo",
    footerAI: "Scheda generata con l'aiuto dell'intelligenza artificiale: può contenere errori, verifica sul libro.",
    soluzioneGuidata: "Soluzione guidata", caricaTentativo: "Carica il tuo tentativo",
    notaTentativo: "La soluzione si sblocca dopo che carichi la foto di un tuo tentativo serio, anche se sbagliato.",
    notaTentativoExport: "La soluzione si sblocca nell'app Studio Amico dopo aver caricato un tuo tentativo.",
    diff_base: "Base", diff_medio: "Medio", diff_avanzato: "Sfida", suggerimento: "Suggerimento",
    tipo_comprensione: "Comprensione", tipo_ragionamento: "Ragionamento", tipo_collegamento: "Collegamento",
    scriviRisposta: "Scrivi qui la tua risposta, poi confronta", confronta: "Confronta con la traccia", traccia: "Traccia",
    vero: "Vero", falso: "Falso", vero_breve: "V", falso_breve: "F", rifaiTest: "Rifai il test", chiaveTest: "Soluzioni del test",
    punteggio: "{ok} giuste su {n} (di {tot})", esito_top: "🏆 Fortissimo!", esito_bene: "👍 Buona base, ripassa gli errori.",
    esito_dai: "🌱 Si impara anche dagli errori: rileggi le spiegazioni e riprova domani.",
    giusto: "Giusto!", sbagliato: "Non proprio.",
    modo_riassunto: "Ripasso veloce", modo_orale: "Interrogazione orale", modo_scritto: "Verifica scritta",
    filtraMateria: "Materia", tutte: "Tutte", archivioVuoto: "Non hai ancora schede.", creaPrima: "Crea la prima scheda",
    ripasso: "Ripasso", ripassoVuoto: "Crea qualche scheda e poi torna qui per ripassare.",
    ripassoTesto: "Scegli le schede da unire: preparo un ripasso o una simulazione di interrogazione o verifica.",
    materia: "Materia", qualiSchede: "Quali schede?", perCosa: "Per cosa?", creaRipasso: "Prepara il ripasso",
    selezionaAlmenoUna: "Seleziona almeno una scheda.",
    impostazioni: "Impostazioni", linguaApp: "Lingua dell'app", linguaSchede: "Lingua delle schede", classe: "Classe",
    lingua_it: "Italiano", lingua_en: "Inglese", lingua_es: "Spagnolo", lingua_fr: "Francese", lingua_de: "Tedesco",
    livello_primaria: "Primaria", livello_media1: "1ª media", livello_media2: "2ª media", livello_media3: "3ª media",
    livello_sup1: "1ª superiore", livello_sup2: "2ª superiore", livello_sup3: "3ª superiore", livello_sup4: "4ª superiore", livello_sup5: "5ª superiore",
    codiceAccesso: "Codice di accesso", datiTitolo: "I tuoi dati",
    datiTesto: "Le schede sono salvate solo in questo browser. Fai un backup per non perderle o per spostarle su un altro dispositivo.",
    backup: "Scarica backup", ripristina: "Ripristina backup", cancellaTutto: "Cancella tutti i dati",
    ripristinate: "{n} schede ripristinate.", fileNonValido: "File non valido.",
    confermaCancellaTutto: "Cancellare TUTTE le schede e le impostazioni da questo dispositivo? Non si può annullare.",
  },
  en: {
    ...MATERIE_EN,
    nav_nuova: "New", nav_archivio: "Archive", nav_ripasso: "Review", nav_impostazioni: "Settings", demo: "DEMO",
    erroreGenerico: "Something went wrong, please try again.",
    car1: "Reading your pages… 👀", car2: "Sorting out the ideas… 🧩", car3: "Preparing exercises and questions… ✏️",
    car4: "Writing the true/false quiz… ✅", car5: "Looking for real-life connections… 🌱",
    benvenuto: "Hi! I'm Study Buddy", benvenutoTesto: "Take photos of the pages you need to study and I'll make you a card with summary, outline, exercises, questions and a quiz.",
    priv1: "Your cards stay on this device only.",
    priv2: "Photos are sent to the AI only to create the card and are not kept by the app.",
    priv3: "Don't photograph faces, names or personal data.",
    priv4: "You can delete everything at any time in Settings.",
    consensoGenitore: "I am a parent/guardian, or I am at least 14 and a parent agrees I can use the app.",
    iniziamo: "Let's start!", leggiPrivacy: "Privacy and safety", indietro: "Back",
    privacyTitolo: "Privacy and safety",
    privacyTesto: `<p><strong>What stays on the device:</strong> cards, quiz results, start/end mood. No account, no data on the app's servers.</p>
      <p><strong>What is sent:</strong> page photos (resized, with metadata such as GPS location removed) and the cards chosen for review are sent to the Anthropic (Claude) AI service only to generate content. Mood and dates are not sent.</p>
      <p><strong>Attempt photos:</strong> used only to check the exercise; the app keeps the comment, not the photo.</p>
      <p><strong>AI-generated content:</strong> may contain mistakes. Always check with your book and teacher.</p>
      <p><strong>Deletion:</strong> Settings → "Delete all data".</p>`,
    quantaVoglia: "How much do you feel like studying today?", energia_poca: "Not much", energia_media: "Okay", energia_tanta: "Loads",
    notaUmore: "There's no wrong answer: it helps me tailor the card.",
    energiaRisposta_poca: "That's fine! A light card, one step at a time 🐢",
    energiaRisposta_media: "Great, let's go! 🙂", energiaRisposta_tanta: "Wow, what energy! I'll add a challenge 🚀",
    sceltaMateria: "Which subject?", cambia: "change",
    fotografa: "Photograph pages and notes", fotografaTesto: "One photo per page, well lit and straight.",
    scatta: "Take photos", galleria: "From gallery", pagina: "Page", rimuovi: "Remove",
    contaFoto: "{n} of {max} photos", avvisoFoto: "No faces or personal data, please.",
    noteFacoltative: "Notes (optional)", notePlaceholder: "E.g. “the teacher mostly asks about dates”",
    creaScheda: "Create the card", maxFoto: "Up to 8 photos.", fotoNonLeggibile: "I can't read this photo.",
    archivio: "Archive", stampa: "Print / PDF", esporta: "Export HTML", elimina: "Delete", sezioni: "Sections",
    nav_abstract: "Summary", nav_schema: "Outline", nav_concetti: "Concepts", nav_esercizi: "Exercises", nav_domande: "Questions",
    nav_vf: "Quiz", nav_vita: "Real life", nav_piano: "Review",
    comeEAndata: "How did it go?", fine_fatica: "Tough", fine_bene: "Good", fine_top: "Great",
    fineRisposta_fatica: "Thanks for being honest. Today's effort is tomorrow's memory 💪",
    fineRisposta_bene: "Nice work, see you next time! 🙂", fineRisposta_top: "Awesome! Remember to review in the next few days 🤩",
    confermaElimina: "Delete this card?",
    controlloTentativo: "Looking at your attempt…",
    tentativoOk: "Attempt received: here's the guided solution!", tentativoNo: "Try again: a real attempt unlocks the solution.",
    abstract: "In short", schema: "Topic outline", concetti: "Key concepts", esercizi: "Exercises", domande: "Questions",
    testVF: "Quiz: 10 true or false", vitaReale: "In real life", pianoRipasso: "Review plan", consiglioMetodo: "Study tip",
    footerAI: "Card generated with the help of AI: it may contain mistakes, check with your book.",
    soluzioneGuidata: "Guided solution", caricaTentativo: "Upload your attempt",
    notaTentativo: "The solution unlocks after you upload a photo of a real attempt, even a wrong one.",
    notaTentativoExport: "The solution unlocks in the Study Buddy app after uploading your attempt.",
    diff_base: "Basic", diff_medio: "Medium", diff_avanzato: "Challenge", suggerimento: "Hint",
    tipo_comprensione: "Understanding", tipo_ragionamento: "Reasoning", tipo_collegamento: "Connection",
    scriviRisposta: "Write your answer here, then compare", confronta: "Compare with the outline answer", traccia: "Outline answer",
    vero: "True", falso: "False", vero_breve: "T", falso_breve: "F", rifaiTest: "Retake quiz", chiaveTest: "Quiz answers",
    punteggio: "{ok} right out of {n} (of {tot})", esito_top: "🏆 Brilliant!", esito_bene: "👍 Good base, review the mistakes.",
    esito_dai: "🌱 Mistakes help you learn: reread the explanations and try again tomorrow.",
    giusto: "Right!", sbagliato: "Not quite.",
    modo_riassunto: "Quick review", modo_orale: "Oral test", modo_scritto: "Written test",
    filtraMateria: "Subject", tutte: "All", archivioVuoto: "No cards yet.", creaPrima: "Create your first card",
    ripasso: "Review", ripassoVuoto: "Create some cards, then come back here to review.",
    ripassoTesto: "Pick the cards to combine: I'll prepare a review or a mock oral/written test.",
    materia: "Subject", qualiSchede: "Which cards?", perCosa: "What for?", creaRipasso: "Prepare review",
    selezionaAlmenoUna: "Select at least one card.",
    impostazioni: "Settings", linguaApp: "App language", linguaSchede: "Card language", classe: "School year",
    lingua_it: "Italian", lingua_en: "English", lingua_es: "Spanish", lingua_fr: "French", lingua_de: "German",
    livello_primaria: "Primary", livello_media1: "Year 7", livello_media2: "Year 8", livello_media3: "Year 9",
    livello_sup1: "Year 10", livello_sup2: "Year 11", livello_sup3: "Year 12", livello_sup4: "Year 13", livello_sup5: "Final year",
    codiceAccesso: "Access code", datiTitolo: "Your data",
    datiTesto: "Cards are saved only in this browser. Make a backup so you don't lose them or to move them to another device.",
    backup: "Download backup", ripristina: "Restore backup", cancellaTutto: "Delete all data",
    ripristinate: "{n} cards restored.", fileNonValido: "Invalid file.",
    confermaCancellaTutto: "Delete ALL cards and settings from this device? This cannot be undone.",
  },
};

let corrente = pref("lingua") ?? (navigator.language?.slice(0, 2) in DIZ ? navigator.language.slice(0, 2) : "it");

export const lang = () => corrente;
export function setLang(l) {
  if (!(l in DIZ)) return;
  corrente = l;
  pref("lingua", l);
}
export const t = (k) => DIZ[corrente][k] ?? DIZ.it[k] ?? k;

export function applicaTraduzioni() {
  document.documentElement.lang = corrente;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
