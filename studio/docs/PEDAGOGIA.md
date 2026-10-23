# Fondamenti pedagogici di Studio Amico

Questo documento spiega **perché** l'app è fatta così e quali ricerche guidano ogni attività.
Le regole operative sono tradotte in istruzioni per l'IA in `server/pedagogia.js`.

> ⚠️ Questo documento è una base di lavoro, non un parere scientifico. Prima di proporre l'app a un ente (es. Fondazione Carispezia)
> va fatto rivedere da un/a pedagogista e da docenti delle singole materie. I riferimenti vanno ricontrollati sulle fonti originali.

---

## 1. Principi generali (validi per tutte le materie)

| Scelta nell'app | Perché | Fonti principali |
|---|---|---|
| Domande, test vero/falso e "spiegalo a voce" invece della sola rilettura | La **pratica del recupero** (richiamare dalla memoria) consolida più della rilettura o della sottolineatura | Roediger & Karpicke (2006), *Psychological Science* 17(3); Dunlosky et al. (2013), *Psychological Science in the Public Interest* 14(1) |
| Piano di ripasso a "domani / 3 giorni / 1 settimana" | La **pratica distribuita** nel tempo batte lo studio concentrato la sera prima | Cepeda et al. (2006), *Psychological Bulletin* 132(3); Dunlosky et al. (2013) |
| Schema massimo a 2 livelli, frasi brevi, niente decorazioni | Teoria del **carico cognitivo**: la memoria di lavoro è limitata | Sweller (1988), *Cognitive Science* 12; Sweller, van Merriënboer & Paas (1998), *Educational Psychology Review* 10 |
| Suggerire di disegnare schemi e linee del tempo | **Codifica duale** e apprendimento multimediale | Paivio (1986); Mayer, *Multimedia Learning* (2009) |
| Domande "perché?" e "come si collega?" | **Interrogazione elaborativa** e auto-spiegazione | Dunlosky et al. (2013) |
| Esercizi da base ad avanzato, il primo facile | Difficoltà "desiderabili" ma raggiungibili; il successo iniziale sostiene la motivazione | Bjork & Bjork (2011), "Making things hard on yourself, but in a good way" |
| Esercizi misti quando ci sono più tipi di problema | **Interleaving** migliora la scelta della strategia | Rohrer & Taylor (2007), *Instructional Science* 35 |
| Ogni risposta del test ha una spiegazione | Il **feedback** è tra gli interventi più efficaci se riguarda il compito e la strategia, non la persona | Hattie & Timperley (2007), *Review of Educational Research* 77(1); Kluger & DeNisi (1996), *Psychological Bulletin* 119(2) |
| Lodi su strategia e impegno, mai "sei intelligente" | Lodare l'intelligenza può ridurre la motivazione dopo un insuccesso | Mueller & Dweck (1998), *JPSP* 75(1). Nota: gli interventi "growth mindset" hanno effetti medi piccoli (Sisk et al., 2018, *Psychological Science* 29(4)): l'app evita la retorica e si limita a un feedback ben fatto |
| Nessun voto alla persona, nessun confronto con altri | Ridurre ansia da prestazione e confronto sociale | Pekrun (2006), *Educational Psychology Review* 18(4) — emozioni di riuscita |

### 1.1 Il test vero/falso: un rischio da gestire

Le affermazioni false possono essere **memorizzate come vere** ("effetto di suggestione negativa"), soprattutto se lo studente
non riceve correzione. Per questo:

- ogni affermazione falsa è accompagnata da una spiegazione che **riformula l'enunciato corretto**, mostrata subito;
- niente trabocchetti linguistici, doppie negazioni, dettagli marginali;
- circa metà vere e metà false.

Fonti: Toppino & Luipersbeck (1993), *Journal of Educational Research* 86(6); Roediger & Marsh (2005), *JEP: Learning, Memory, and Cognition* 31(5);
Butler & Roediger (2008), *Memory & Cognition* 36(3) — il feedback riduce gli effetti negativi.

### 1.2 Soluzione solo dopo un tentativo serio

Provare a risolvere **prima** di vedere la soluzione, anche sbagliando, migliora l'apprendimento successivo
(effetto del tentativo di recupero non riuscito, "pretesting", *productive failure*).
Kornell, Hays & Bjork (2009), *JEP: LMC* 35(4); Richland, Kornell & Kao (2009), *JEP: Applied* 15(3); Kapur (2014), *Cognitive Science* 38(5).

Cautele adottate:
- un tentativo **sbagliato** ma reale è sempre "serio": l'obiettivo è l'impegno, non la correttezza;
- se il tentativo non è serio non c'è una punizione, ma un piccolo indizio per ripartire;
- la soluzione è guidata e parte dal ragionamento dello studente;
- per i principianti gli **esempi svolti** sono utili (Sweller & Cooper, 1985; Kalyuga et al., 2003, *expertise reversal*):
  l'abstract e lo schema possono contenere esempi svolti, ma **mai** la soluzione degli esercizi proposti.

### 1.3 "Quanta voglia hai?" / "Com'è andata?"

- È un'**autovalutazione volontaria** a 3 livelli, non una misura. Non si deducono mai emozioni da volti o voce
  (oltre che sbagliato, il riconoscimento delle emozioni in ambito educativo è **vietato** dall'AI Act, art. 5).
- Serve a **adattare** la scheda (con poca voglia: scheda più corta, primo successo rapido) e a dare un riscontro allo studente.
- Il dato resta sul dispositivo e **non viene inviato all'IA**.
- Le risposte dell'app sono sempre accoglienti: "poca voglia" non è un errore.

### 1.4 Metacognizione
Consiglio di metodo in ogni scheda e piano di ripasso: insegnare *come* si studia è tra gli interventi più efficaci
e meno costosi. EEF (Education Endowment Foundation), *Metacognition and Self-Regulated Learning*, Guidance Report (2018, agg. 2021).

---

## 2. Linee guida per materia

### Italiano
- Comprensione con strategie esplicite: prevedere, porsi domande, riassumere, chiarire (*reciprocal teaching*).
  Palincsar & Brown (1984), *Cognition and Instruction* 1(2).
- Grammatica: dagli esempi d'uso alla regola.
- Letteratura: più interpretazioni accettabili se motivate dal testo.
- **Da evitare:** liste di regole decontestualizzate; giudizi sul "talento" nella scrittura.

### Matematica
- Equilibrio tra esempi svolti (nella spiegazione) e problemi da risolvere; comprensione concettuale oltre alla procedura.
- Rappresentazioni multiple (numerica, grafica, simbolica, verbale).
- Interleaving dei tipi di problema (Rohrer & Taylor, 2007).
- **Ansia da matematica:** evitare "è facile/ovvio", gare a tempo, confronti. Ashcraft (2002), *Current Directions in Psychological Science* 11(5);
  stereotipi di genere: Beilock et al. (2010), *PNAS* 107(5).

### Fisica e Scienze
- Far emergere le **misconcezioni** (forza e moto, calore e temperatura...) con domande di previsione.
  Driver, Guesne & Tiberghien (1985), *Children's Ideas in Science*; Hestenes, Wells & Swackhamer (1992), *The Physics Teacher* 30.
- Approccio per indagine; distinguere fatto, ipotesi, teoria.
- **Sicurezza:** esperimenti solo con materiali domestici sicuri e supervisione adulta; nessun consiglio medico.

### Storia
- Pensiero storico: fonti, cause/conseguenze, continuità/cambiamento, prospettive, dimensione etica contestualizzata.
  Wineburg (2001), *Historical Thinking and Other Unnatural Acts*; Seixas & Morton (2013), *The Big Six Historical Thinking Concepts*.
- Temi traumatici trattati con rispetto e senza dettagli cruenti, adeguati all'età.

### Geografia
- Relazioni spazio–ambiente–società, lettura di carte e grafici, niente stereotipi su popoli e paesi.

### Lingue straniere
- Lessico in contesto e incontri ripetuti con le parole: Nation (2001), *Learning Vocabulary in Another Language*.
- Produrre lingua, non solo riconoscerla (*output hypothesis*): Swain (1985).

### Latino e Greco
- Analisi guidata passo per passo, lessico con derivati italiani. Nessuna traduzione fornita negli esercizi.
- Evidenza empirica specifica limitata: si applicano i principi generali.

### Filosofia
- Ricostruire argomenti, discutere posizioni diverse. Philosophy for Children: Trickey & Topping (2004), *Research Papers in Education* 19(3).
- Nessuna indicazione su cosa pensare in ambito etico, religioso, politico.

### Arte
- Osservazione guidata (descrivere, analizzare, interpretare): Yenawine (2013), *Visual Thinking Strategies*.

### Tecnologia / Informatica
- Pensiero computazionale: Wing (2006), *Communications of the ACM* 49(3).
- Leggere e tracciare codice prima di scriverlo: Lister et al. (2004), ITiCSE Working Group Reports.

### Educazione civica
- Più punti di vista, nessuna propaganda.

---

## 3. IA e minori: indicazioni internazionali

- UNESCO (2023), *Guidance for generative AI in education and research*: età minima suggerita 13 anni per l'uso autonomo,
  supervisione umana, verifica dei contenuti.
- UNICEF (2021), *Policy guidance on AI for children* v2: benessere, privacy, trasparenza, inclusione.
- In Italia: linee guida del Ministero dell'Istruzione e del Merito sull'IA nelle scuole (2025) — **da consultare** per un uso scolastico.

Come l'app li applica: avviso "contenuto generato da IA, può contenere errori" su ogni scheda; uso solo come supporto (non sostituisce
libro e insegnante); nessuna chat libera; nessuna profilazione.

---

## 4. Cosa resta da fare (per un uso su larga scala)

1. Revisione di questo documento da parte di pedagogisti e docenti per materia.
2. Valutazione su un campione di schede generate (accuratezza, adeguatezza all'età, qualità degli esercizi) con una griglia condivisa.
3. Attenzione a DSA/BES: font leggibili, sintesi vocale, mappe concettuali — da progettare con esperti (L. 170/2010).
4. Studio pilota con misure prima/dopo e ascolto di studenti, famiglie, insegnanti.
