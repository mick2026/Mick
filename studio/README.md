# 🦉 Studio Amico

App di supporto allo studio. Scegli la materia, fotografi pagine e appunti e ottieni una **scheda interattiva** con:

- **In breve** (abstract) e **schema** degli argomenti
- **Concetti chiave**
- **Esercizi** (la soluzione si sblocca solo dopo aver caricato la foto di un tentativo serio)
- **Domande** per lo studio e l'interrogazione (la traccia di risposta si vede solo dopo aver scritto la propria)
- **Test di 10 vero/falso** con spiegazioni e punteggio
- **Collegamenti con la vita reale**, **piano di ripasso** e consiglio di metodo

Inoltre:
- 🐢🙂🚀 all'inizio "Quanta voglia hai?" e 😮‍💨🙂🤩 alla fine "Com'è andata?" (la scheda si adatta all'energia)
- 🗂️ archivio per materia e data, salvato **solo sul dispositivo**
- 🔁 **Ripasso**: unisce più schede in un ripasso veloce, una simulazione di **interrogazione orale** o di **verifica scritta**
- 🖨️ stampa **A4 / PDF** (spazi per scrivere, chiave del test su pagina separata)
- 📤 export in **HTML** autonomo, da inviare e usare offline (sul telefono apre il menu di condivisione)
- 🌍 multilingue: interfaccia IT/EN, schede in IT/EN/ES/FR/DE
- 💾 backup e ripristino, cancellazione totale

Documenti importanti:
- [`docs/PEDAGOGIA.md`](docs/PEDAGOGIA.md) — ricerche che guidano le attività, per materia
- [`docs/PRIVACY-SICUREZZA.md`](docs/PRIVACY-SICUREZZA.md) — privacy, sicurezza, GDPR, AI Act, legge italiana sull'IA

## Avvio

Serve Node.js 20+ e una chiave API Anthropic.

```bash
cd studio
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://127.0.0.1:8787
npm run demo                                # prova l'interfaccia senza chiave (contenuti finti)
npm test
```

Usarla dal telefono sulla rete di casa:

```bash
HOST=0.0.0.0 APP_ACCESS_CODE=una-parola-segreta ANTHROPIC_API_KEY=... npm start
```
poi apri `http://<ip-del-computer>:8787` sul telefono e inserisci il codice in Impostazioni.
"Aggiungi a schermata Home" la fa sembrare un'app. Per uso fuori casa serve un hosting con **HTTPS**.

| Variabile | Default | Significato |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Chiave API (solo sul server) |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | Indirizzo del server |
| `APP_ACCESS_CODE` | vuoto | Se impostato, le richieste all'IA richiedono questo codice |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Modello |
| `CLAUDE_EFFORT` | `medium` | Profondità di ragionamento (`low`…`max`) |
| `DEMO` | — | `1` = risposte finte, nessuna chiamata all'IA |

**Costi indicativi** (Claude Opus 5.5, $4/$20 per milione di token in ingresso/uscita): una scheda da 4 pagine
costa nell'ordine di 0,10–0,30 $. Da misurare sull'uso reale.

## Struttura

```
server/
  index.js       server HTTP: file statici, API, intestazioni di sicurezza, limiti
  claude.js      chiamate a Claude (output JSON strutturato, fallback in caso di rifiuto)
  pedagogia.js   principi didattici e linee guida per materia inseriti nei prompt
  schemas.js     schema JSON della scheda e della verifica del tentativo
  validate.js    validazione degli input
  demo.js        risposte finte per DEMO=1
public/
  index.html, styles.css (incl. stampa A4), app.js (viste), render.js (scheda),
  i18n.js (traduzioni), db.js (IndexedDB), img.js (ridimensiona e rimuove EXIF), export.js
docs/            pedagogia, privacy e sicurezza
test/            test del server e della validazione
```

## Aggiungere una lingua
1. In `public/i18n.js` copia il blocco `it`, traducilo e aggiungi la lingua a `LINGUE_UI`.
2. Per le schede: aggiungi la lingua a `LINGUE` in `server/pedagogia.js` e a `LINGUE_SCHEDE` in `public/app.js`.

## Verso una proposta a Fondazione Carispezia
1. Uso in famiglia e raccolta di esempi reali
2. Revisione pedagogica (docenti + pedagogista) e privacy (DPO, DPIA) — vedi checklist in `docs/PRIVACY-SICUREZZA.md`
3. Pilota con una o due classi, misure prima/dopo, questionari a studenti, famiglie e docenti
4. Funzioni per l'inclusione (DSA/BES): sintesi vocale, font ad alta leggibilità, mappe
5. Hosting UE, account per scuole, sincronizzazione opzionale e cifrata
