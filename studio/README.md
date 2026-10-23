# 🦉 Studio Amico

> **Strumento di supporto allo studio:** non sostituisce la scuola, gli insegnanti né i percorsi di
> apprendimento riconosciuti e consolidati. La guida completa per famiglie e ragazzi è nell'app
> (pulsante ❓, pagina `#/guida`, testo in `public/guida.js`).

App di supporto allo studio. Scegli la materia, fotografi pagine e appunti e ottieni una **scheda interattiva** con:

- **In breve** (abstract) e **schema** degli argomenti
- **Concetti chiave**
- **Esercizi** (la soluzione si sblocca solo dopo aver caricato la foto di un tentativo serio)
- **Domande** per lo studio e l'interrogazione (la traccia di risposta si vede solo dopo aver scritto la propria)
- **Test di 10 vero/falso** con spiegazioni e punteggio
- **Collegamenti con la vita reale**, **piano di ripasso** e consiglio di metodo

Inoltre:
- 🐢🙂🚀 all'inizio "Quanta voglia hai?" e 😮‍💨🙂🤩 alla fine "Com'è andata?" (la scheda si adatta all'energia)
- 👨‍👩‍👧 **login del genitore** con codice via email, **profili per i figli**, consenso registrato, limite mensile di schede
- 🗂️ archivio per materia e data, salvato sul server (ritrovi le schede su ogni dispositivo)
- 🔁 **Ripasso**: unisce più schede in un ripasso veloce, una simulazione di **interrogazione orale** o di **verifica scritta**
- 🖨️ stampa **A4 / PDF** (spazi per scrivere, chiave del test su pagina separata)
- 📤 export in **HTML** autonomo, da inviare e usare offline (sul telefono apre il menu di condivisione)
- 🌍 multilingue: interfaccia IT/EN, schede in IT/EN/ES/FR/DE
- 💾 scarica tutti i dati, elimina account

Documenti importanti:
- [`docs/PEDAGOGIA.md`](docs/PEDAGOGIA.md) — ricerche che guidano le attività, per materia
- [`docs/PRIVACY-SICUREZZA.md`](docs/PRIVACY-SICUREZZA.md) — privacy, sicurezza, GDPR, AI Act, legge italiana sull'IA
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — **come metterla online** (Anthropic, Supabase, Render/Fly, dominio)

## Versione su claude.ai (dal telefono, senza installare nulla)

`artifact/` contiene la versione pubblicata come pagina su claude.ai: Claude viene chiamato con l'account
di chi la usa (nessuna chiave API), le schede si salvano nello spazio privato dell'utente, PDF e HTML si scaricano.
Usa gli stessi testi, grafica e istruzioni didattiche della versione server.

```bash
node artifact/build.mjs     # crea artifact/studio-amico.html (file unico da pubblicare)
```

## Avvio (versione server)

Serve Node.js 20.12+.

```bash
cd studio
npm install
npm run demo     # prova completa senza nessun account: login finto (codice a schermo), dati in memoria, schede finte
npm start        # con ANTHROPIC_API_KEY nel file .env: schede vere, login finto e dati in memoria
npm test
```

Per la versione vera con login e database, e per pubblicarla online: [`docs/DEPLOY.md`](docs/DEPLOY.md).
Le impostazioni stanno nel file `.env` (vedi `.env.example`).

| Variabile | Default | Significato |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Chiave API (solo sul server) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | — | Login e database; senza, modalità di prova |
| `LIMITE_PROVA` / `LIMITE_ABBONATO` | 5 / 40 | Schede al mese per famiglia |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | Indirizzo del server |
| `CLAUDE_MODEL` / `CLAUDE_EFFORT` | `claude-opus-5-5` / `medium` | Modello e profondità di ragionamento |
| `DEMO` | — | `1` = schede finte, nessuna chiamata all'IA (vietato in produzione) |
| `STORE_FILE` | — | Con il login di prova, salva i dati in un file JSON |

**Costi indicativi** (Claude Opus 5.5, $4/$20 per milione di token in ingresso/uscita): una scheda da 4 pagine
costa nell'ordine di 0,10–0,30 $. Da misurare sull'uso reale.

## Struttura

```
server/
  index.js       server HTTP: rotte API, intestazioni di sicurezza, limiti
  config.js      configurazione e controlli per la produzione
  auth.js        login con codice email (Supabase) o di prova
  store/         archivio: supabase.js (produzione) e memoria.js (prove e test)
  claude.js      chiamate a Claude (output JSON strutturato, fallback in caso di rifiuto)
  pedagogia.js   principi didattici e linee guida per materia inseriti nei prompt
  schemas.js     schema JSON della scheda e della verifica del tentativo
  prompt.js      istruzioni a Claude (condivise con la versione claude.ai)
  validate.js    validazione degli input
  demo.js        risposte finte per DEMO=1
public/
  index.html, styles.css (incl. stampa A4), app.js (viste), render.js (scheda),
  i18n.js (traduzioni), db.js (preferenze), img.js (ridimensiona e rimuove EXIF), export.js
artifact/        versione claude.ai: app.js, extra.css, shell.html, build.mjs
docs/            pedagogia, privacy e sicurezza, pubblicazione online
supabase/        schema del database (da eseguire una volta in Supabase)
Dockerfile, fly.toml, ../render.yaml   pubblicazione su Render o Fly.io
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
