// Guida all'uso mostrata nell'app (#/guida). Testi lunghi tenuti qui per non appesantire i18n.js.
// Sono HTML statico scritto da noi: nessun dato dell'utente viene inserito.

export const GUIDA = {
  it: `
<p class="avvertenza"><strong>Studio Amico è uno strumento di supporto allo studio.</strong>
Non sostituisce la scuola, gli insegnanti, i libri di testo né i percorsi di apprendimento
riconosciuti e consolidati (lezioni, studio guidato, recupero, doposcuola, tutoraggio, supporti
specialistici). Va usato <em>insieme</em> a questi, mai al loro posto.</p>

<details open><summary>🎯 A cosa serve</summary>
<p>Aiuta ragazze e ragazzi a <strong>ripassare e consolidare</strong> ciò che hanno già incontrato a
scuola. Fotografi le pagine del libro o i tuoi appunti e l'app prepara una <strong>scheda di studio</strong>
interattiva: un riassunto breve, lo schema degli argomenti, i concetti chiave, esercizi e domande,
un test di 10 vero/falso e collegamenti con la vita di tutti i giorni.</p>
<p>Le schede restano salvate per materia e con la data, così puoi riprenderle, rifare i test e
prepararti a interrogazioni e verifiche.</p>
<p>L'obiettivo non è “fare i compiti al posto tuo”, ma farti <strong>allenare a ricordare e
ragionare</strong>: per questo l'app fa domande, propone esercizi e non dà le soluzioni finché non
hai provato davvero.</p>
</details>

<details><summary>⚠️ Cosa Studio Amico NON è</summary>
<ul>
<li><strong>Non è un insegnante</strong> e non sostituisce le spiegazioni in classe, il dialogo con i
docenti o il lavoro sui libri di testo adottati dalla scuola.</li>
<li><strong>Non è un metodo didattico certificato</strong> né un percorso riconosciuto da scuole o
enti: è un aiuto per lo studio a casa, scelto dalla famiglia.</li>
<li><strong>Non valuta e non dà voti.</strong> Il punteggio dei test serve solo a te per capire cosa
ripassare; la verifica del “tentativo serio” serve solo a sbloccare la soluzione. Nessun risultato
dell'app ha valore scolastico.</li>
<li><strong>Non è uno strumento compensativo o riabilitativo.</strong> Per DSA, BES o altre esigenze
specifiche valgono il Piano Didattico Personalizzato, gli strumenti indicati dalla scuola e il parere
degli specialisti. L'app può affiancarli solo se loro lo ritengono utile.</li>
<li><strong>Non è un servizio di supporto psicologico.</strong> La domanda sulla voglia di studiare è
un gioco veloce per adattare la scheda, non una valutazione dell'umore.</li>
<li><strong>Non è infallibile.</strong> I contenuti sono generati da un'intelligenza artificiale e
possono contenere errori o imprecisioni.</li>
</ul>
</details>

<details><summary>👨‍👩‍👧 Per chi è e il ruolo dei genitori</summary>
<p>L'account lo apre un <strong>genitore o tutore maggiorenne</strong>, che crea un profilo per ogni
figlio (basta un soprannome) e dà il consenso al trattamento dei dati.</p>
<p>Consigliamo ai genitori di:</p>
<ul>
<li>guardare insieme le prime schede e spiegare come usarle;</li>
<li>ricordare che l'app non sostituisce lo studio sul libro né il confronto con gli insegnanti;</li>
<li>concordare tempi e modi d'uso, con pause e senza sostituire il sonno o il tempo libero;</li>
<li>parlare con la scuola se l'app viene usata con regolarità, così che non ci siano conflitti con le
indicazioni dei docenti.</li>
</ul>
</details>

<details><summary>🧭 Come funziona, passo per passo</summary>
<ol>
<li><strong>Accesso.</strong> Inserisci l'email del genitore e ricevi un codice o un link (nessuna
password). Durante il periodo di prova le iscrizioni vengono approvate a mano.</li>
<li><strong>Profilo e materie.</strong> Crea il profilo del ragazzo/a indicando la classe. Puoi indicare
anche il tipo di scuola: l'app propone le materie di quell'anno, che puoi modificare. Oppure crei le
materie liberamente (Impostazioni → Materie, o “Nuova materia” quando prepari una scheda).</li>
<li><strong>Quanta voglia hai?</strong> All'inizio scegli tra 🐢 pochina, 🙂 normale, 🚀 tantissima. Con poca voglia
la scheda è più corta e il primo esercizio è facile, per partire con un piccolo successo.</li>
<li><strong>Materia e foto.</strong> Scegli la materia e fotografa fino a 8 pagine o appunti. Inquadra
solo il testo: niente volti, nomi o dati personali.</li>
<li><strong>Genera la scheda.</strong> In meno di un minuto ottieni la scheda. Leggila con calma.</li>
<li><strong>Allenati.</strong> Rispondi alle domande prima di aprire la traccia, fai il test vero/falso
e prova gli esercizi.</li>
<li><strong>Come è andata?</strong> Alla fine scegli 😮‍💨 faticoso, 🙂 bene o 🤩 alla grande: ti aiuta a ricordare come ti sei
trovato/a con quell'argomento.</li>
</ol>
</details>

<details><summary>🗂️ Cosa contiene una scheda</summary>
<ul>
<li><strong>Abstract</strong>: il cuore dell'argomento in poche righe.</li>
<li><strong>Schema</strong>: gli argomenti in ordine, su massimo due livelli.</li>
<li><strong>Concetti chiave</strong> con definizioni semplici.</li>
<li><strong>Esercizi</strong> in ordine di difficoltà, con un suggerimento che orienta senza risolvere.</li>
<li><strong>Domande</strong> per lo studio e l'interrogazione, con una traccia da aprire solo dopo aver
provato a rispondere.</li>
<li><strong>Test di 10 vero/falso</strong>, ognuno con la spiegazione.</li>
<li><strong>Nella vita reale</strong>: dove ritrovi l'argomento nella vita di tutti i giorni.</li>
<li><strong>Piano di ripasso</strong> distanziato nei giorni successivi e un <strong>consiglio di metodo</strong>.</li>
</ul>
</details>

<details><summary>✏️ Esercizi: la soluzione arriva dopo il tuo tentativo</summary>
<p>Per ogni esercizio la soluzione è <strong>bloccata</strong>. Per sbloccarla fotografi il tuo
tentativo di svolgimento, anche sbagliato o incompleto: conta che ci sia un lavoro vero.</p>
<p>L'app ti dà un commento su cosa hai fatto bene e dove ti sei bloccato/a, poi mostra la soluzione
guidata passo per passo partendo dal tuo ragionamento. Se la foto non mostra un tentativo
(foglio vuoto, consegna ricopiata, soluzione presa altrove) ricevi un indizio per ripartire.</p>
<p>Perché? Le ricerche mostrano che provare prima di vedere la soluzione, anche sbagliando, aiuta
a capire e ricordare molto meglio che leggere subito la risposta.</p>
</details>

<details><summary>🔁 Ripasso, interrogazioni e verifiche</summary>
<p>Nella sezione <strong>Ripasso</strong> scegli una materia e alcune schede già fatte. L'app le unisce in:</p>
<ul>
<li><strong>Riassunto</strong>: un ripasso unico che mette in collegamento gli argomenti;</li>
<li><strong>Interrogazione orale</strong>: domande come le farebbe un insegnante, con la traccia per esporre;</li>
<li><strong>Verifica scritta</strong>: una simulazione di compito in classe, senza soluzioni.</li>
</ul>
<p>Sono simulazioni per allenarsi: le domande vere dell'insegnante possono essere diverse.</p>
</details>

<details><summary>🖨️ Condividere e stampare</summary>
<p>Da ogni scheda puoi <strong>stampare o salvare in PDF</strong> (formato A4) e <strong>scaricare un file
HTML</strong> da inviare, che si apre in qualsiasi browser anche senza account. Il file esportato non
contiene le soluzioni degli esercizi.</p>
</details>

<details><summary>🧠 Il metodo dietro l'app</summary>
<p>Le istruzioni date all'intelligenza artificiale seguono principi della ricerca sull'apprendimento:</p>
<ul>
<li><strong>pratica del recupero</strong>: richiamare dalla memoria è più efficace che rileggere;</li>
<li><strong>ripasso distanziato</strong> nel tempo invece che tutto all'ultimo;</li>
<li><strong>carico cognitivo</strong> contenuto: un concetto alla volta, schemi brevi;</li>
<li><strong>feedback spiegato</strong> e vero/falso senza trabocchetti;</li>
<li><strong>difficoltà crescente</strong>, con un primo successo rapido;</li>
<li>attenzione specifica per ogni materia (es. ansia da matematica, misconcezioni in fisica,
pensiero storico, temi sensibili adeguati all'età).</li>
</ul>
<p>Questi principi orientano le schede ma non garantiscono risultati: l'efficacia dipende da come
l'app viene usata e dal percorso scolastico in cui si inserisce.</p>
</details>

<details><summary>👍 Come usarla bene</summary>
<ul>
<li><strong>Prima studia</strong> sul libro e sugli appunti, poi usa la scheda per ripassare e verificarti.</li>
<li><strong>Prova a rispondere da solo/a</strong> prima di aprire tracce e spiegazioni.</li>
<li><strong>Controlla sempre</strong> sul libro e chiedi all'insegnante se qualcosa non torna o è diverso
da quanto spiegato in classe.</li>
<li><strong>Non consegnare</strong> testi o esercizi dell'app come lavoro tuo: rispetta le regole della
tua scuola sull'uso dell'intelligenza artificiale.</li>
<li><strong>Brevi sessioni</strong> (20-30 minuti) con pause funzionano meglio di maratone.</li>
<li><strong>Riprendi le schede</strong> nei giorni indicati dal piano di ripasso.</li>
</ul>
</details>

<details><summary>🤖 Limiti dell'intelligenza artificiale</summary>
<ul>
<li>Può <strong>sbagliare</strong>: date, formule, traduzioni o interpretazioni non corrette. Ogni scheda
lo ricorda in fondo.</li>
<li>Può <strong>leggere male</strong> foto sfocate o scritte a mano: in quel caso la scheda lo segnala negli
avvisi.</li>
<li>Usa solo ciò che c'è nelle foto: se le pagine sono incomplete, lo sarà anche la scheda.</li>
<li>Non conosce le richieste specifiche del tuo insegnante né il programma della tua classe.</li>
<li>Se trovi un contenuto sbagliato o non adatto, avvisa un genitore.</li>
</ul>
</details>

<details><summary>💛 Benessere</summary>
<p>La domanda su voglia e soddisfazione è <strong>volontaria e dichiarata da te</strong>: l'app non analizza
volti, voce o comportamento e non trae conclusioni su come stai. Se lo studio ti mette spesso in
ansia o ti fa stare male, parlane con un genitore, un insegnante o una persona di fiducia.</p>
</details>

<details><summary>🔒 Privacy in breve</summary>
<ul>
<li>Le foto servono solo a creare la scheda e <strong>non vengono conservate</strong>.</li>
<li>Per i ragazzi si usano solo soprannome, classe, lingua e materie.</li>
<li>Le schede sono visibili solo alla tua famiglia; puoi scaricare tutti i dati o eliminare l'account
dalle Impostazioni.</li>
</ul>
<p>Dettagli completi nella pagina <a href="#/privacy">Privacy e sicurezza</a>.</p>
</details>

<details><summary>❓ Domande frequenti</summary>
<p><strong>Posso usarla al posto dello studio sul libro?</strong> No. La scheda è un riassunto per
ripassare: lo studio vero passa da lezioni, libro e appunti.</p>
<p><strong>Il punteggio del test conta per la scuola?</strong> No, serve solo a te per capire cosa
ripassare.</p>
<p><strong>Perché non mi dà subito la soluzione?</strong> Perché provare prima fa imparare di più.
Carica una foto del tuo tentativo, anche sbagliato.</p>
<p><strong>Quante schede posso fare?</strong> C'è un limite mensile per famiglia, indicato nelle
Impostazioni.</p>
<p><strong>La scheda dice una cosa diversa dal libro.</strong> Vale il libro (e l'insegnante). L'IA
può sbagliare.</p>
</details>
`,
  en: `
<p class="avvertenza"><strong>Studio Amico is a study support tool.</strong>
It does not replace school, teachers, textbooks or recognised, established learning pathways
(lessons, guided study, catch-up classes, after-school programmes, tutoring, specialist support).
It is meant to be used <em>alongside</em> them, never instead of them.</p>

<details open><summary>🎯 What it is for</summary>
<p>It helps students <strong>review and consolidate</strong> what they have already met at school. You
photograph textbook pages or your notes and the app prepares an interactive <strong>study card</strong>:
a short summary, a topic outline, key concepts, exercises and questions, a 10-item true/false test
and real-life connections.</p>
<p>Cards are saved by subject and date, so you can come back to them, retake tests and prepare for
oral and written tests.</p>
<p>The goal is not to “do your homework for you” but to help you <strong>practise remembering and
reasoning</strong>: that is why the app asks questions, sets exercises and withholds solutions until
you have genuinely tried.</p>
</details>

<details><summary>⚠️ What Studio Amico is NOT</summary>
<ul>
<li><strong>It is not a teacher</strong> and does not replace classroom explanations, talking with
teachers or working on the textbooks chosen by the school.</li>
<li><strong>It is not a certified teaching method</strong> or a programme recognised by schools or
institutions: it is a home study aid chosen by the family.</li>
<li><strong>It does not assess or grade.</strong> Test scores are only for you; the “serious attempt”
check only unlocks the solution. Nothing in the app has any school value.</li>
<li><strong>It is not a compensatory or remedial tool.</strong> For learning difficulties or special
needs, the school's personalised plan, its recommended tools and specialists' advice come first.</li>
<li><strong>It is not psychological support.</strong> The “how much do you feel like studying” question
is a quick game to adapt the card, not a mood assessment.</li>
<li><strong>It is not infallible.</strong> Content is generated by artificial intelligence and may
contain mistakes.</li>
</ul>
</details>

<details><summary>👨‍👩‍👧 Who it is for and the parents' role</summary>
<p>The account is opened by an <strong>adult parent or guardian</strong>, who creates a profile for each
child (a nickname is enough) and consents to the data processing.</p>
<ul>
<li>Look at the first cards together and explain how to use them.</li>
<li>Remind them the app does not replace the textbook or teachers.</li>
<li>Agree on when and how long to use it, with breaks.</li>
<li>Talk to the school if the app is used regularly, to avoid conflicts with teachers' guidance.</li>
</ul>
</details>

<details><summary>🧭 How it works, step by step</summary>
<ol>
<li><strong>Sign in</strong> with the parent's email and a code or link (no password). During the trial,
sign-ups are approved manually.</li>
<li><strong>Profile and subjects.</strong> Set the school year and, optionally, the type of school: the
app suggests that year's subjects, which you can edit. Or create subjects freely.</li>
<li><strong>How much do you feel like it?</strong> 🐢 a little, 🙂 normal, 🚀 a lot: with low energy the card is
shorter and starts with an easy win.</li>
<li><strong>Subject and photos</strong>: up to 8 pages or notes. Text only: no faces, names or personal data.</li>
<li><strong>Generate the card</strong> and read it calmly.</li>
<li><strong>Practise</strong>: answer before opening hints, take the true/false test, try the exercises.</li>
<li><strong>How did it go?</strong> Pick 😮‍💨, 🙂 or 🤩 at the end.</li>
</ol>
</details>

<details><summary>✏️ Exercises: the solution comes after your attempt</summary>
<p>Each solution is <strong>locked</strong>. Photograph your attempt, even if wrong or incomplete: what
matters is real work. You get feedback and then a step-by-step solution that starts from your
reasoning. Trying before seeing the answer helps you understand and remember much better.</p>
</details>

<details><summary>🔁 Review, oral and written tests</summary>
<p>In <strong>Review</strong> pick a subject and some cards: the app combines them into a summary, an oral
test practice or a written test simulation. These are practice runs: real teacher questions may differ.</p>
</details>

<details><summary>🖨️ Sharing and printing</summary>
<p>Each card can be <strong>printed or saved as an A4 PDF</strong> and <strong>downloaded as HTML</strong> to
share. The exported file does not contain exercise solutions.</p>
</details>

<details><summary>🧠 The method behind the app</summary>
<p>Instructions to the AI follow learning research: retrieval practice, spaced review, limited
cognitive load, explained feedback, increasing difficulty and subject-specific care. These principles
guide the cards but do not guarantee results.</p>
</details>

<details><summary>👍 Using it well</summary>
<ul>
<li><strong>Study first</strong> from the book and notes, then use the card to review and test yourself.</li>
<li><strong>Always check</strong> with the book and ask your teacher if something differs.</li>
<li><strong>Do not hand in</strong> app content as your own work: follow your school's rules on AI.</li>
<li><strong>Short sessions</strong> (20-30 minutes) with breaks work best.</li>
</ul>
</details>

<details><summary>🤖 Limits of AI</summary>
<p>It can make mistakes, misread blurry or handwritten photos, and it only uses what is in the photos.
It does not know your teacher's requirements. If you find wrong or unsuitable content, tell a parent.</p>
</details>

<details><summary>💛 Wellbeing</summary>
<p>The mood questions are <strong>voluntary and self-reported</strong>: the app does not analyse faces,
voice or behaviour. If studying often makes you anxious, talk to a parent, a teacher or someone you trust.</p>
</details>

<details><summary>🔒 Privacy in short</summary>
<p>Photos are used only to create the card and <strong>are not stored</strong>. Full details on the
<a href="#/privacy">Privacy and safety</a> page.</p>
</details>
`,
};
