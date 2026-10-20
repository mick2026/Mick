# Privacy, sicurezza e normativa applicabile

> ⚠️ Analisi tecnica preliminare, **non è un parere legale**. Prima di un uso con studenti esterni alla famiglia
> (es. progetto con Fondazione Carispezia o scuole) serve la verifica di un legale/DPO.

## 1. Come l'app tratta i dati (privacy by design, art. 25 GDPR)

| Dato | Dove sta | Inviato all'IA? | Conservato da noi? |
|---|---|---|---|
| Foto di pagine e appunti | Solo in memoria durante la creazione | Sì, per generare la scheda | **No** (né sul dispositivo né sul server) |
| Foto dei tentativi di esercizio | Solo in memoria | Sì, per verificare il tentativo | **No**: resta solo il commento testuale |
| Schede, risultati test, esiti esercizi | IndexedDB del browser, sul dispositivo | Solo le schede scelte per il ripasso (solo testi di contenuto) | Solo sul dispositivo |
| Umore inizio/fine | Sul dispositivo | **No** (solo il livello di energia, senza data, per adattare la scheda) | Solo sul dispositivo |
| Account, nome, email, scuola | **Non raccolti** | — | — |

Misure tecniche:
- **Minimizzazione**: le foto vengono ridimensionate e **ricodificate** nel browser, eliminando i metadati EXIF (es. posizione GPS).
- Il server **non scrive su disco e non registra** i contenuti; nei log vanno solo i tipi di errore.
- La chiave API sta **solo sul server** (variabile d'ambiente), mai nel browser.
- Le istruzioni all'IA vietano di riportare nomi, volti o dati personali presenti nelle foto, e trattano il testo nelle immagini come contenuto, non come comandi (difesa da *prompt injection*).
- Tutto ciò che viene dall'IA è **escapato** prima di essere mostrato (protezione XSS) + Content-Security-Policy restrittiva.
- Limite di richieste per IP, dimensione massima delle richieste, validazione di tutti gli input, codice di accesso opzionale (`APP_ACCESS_CODE`).
- Cancellazione totale con un pulsante (Impostazioni → Cancella tutti i dati); backup/ripristino in JSON gestito dall'utente.
- Il file HTML esportato **non contiene** le soluzioni degli esercizi.

Rischi residui da conoscere:
- Chi ha accesso al dispositivo vede le schede: usare il blocco schermo.
- Le immagini sono elaborate da Anthropic (fornitore USA) — vedi §3.
- L'IA può sbagliare: avviso fisso su ogni scheda e in stampa.

## 2. Normativa applicabile

### GDPR (Reg. UE 2016/679) e Codice privacy (D.Lgs. 196/2003 mod. D.Lgs. 101/2018)
- **Consenso dei minori (art. 8 GDPR + art. 2-quinquies Codice)**: in Italia il minore può prestare consenso per i servizi della società dell'informazione dai **14 anni**; sotto, serve il genitore. L'app mostra al primo avvio una conferma genitore/≥14 anni.
- **Informativa chiara e adatta ai minori (art. 12-13)**: schermata Privacy nell'app; per un servizio a terzi serve un'informativa completa (titolare, finalità, base giuridica, destinatari, trasferimenti, diritti).
- **Ruoli**: in uso familiare il trattamento è prevalentemente domestico (art. 2.2.c). Se un ente offre il servizio diventa **titolare**; Anthropic sarebbe **responsabile** (art. 28) con DPA.
- **DPIA (art. 35)**: necessaria per un servizio a minori basato su IA su larga scala (criteri WP29/EDPB: soggetti vulnerabili + nuove tecnologie).
- **Trasferimento extra-UE (artt. 44 ss.)**: Anthropic è negli USA → verificare adesione al EU-US Data Privacy Framework e/o clausole contrattuali standard.

### AI Act (Reg. UE 2024/1689)
- **Art. 5 – pratiche vietate**: è vietato il riconoscimento delle emozioni nei contesti educativi. L'app **non** lo fa: l'umore è un'autodichiarazione volontaria.
- **Allegato III, punto 3 (istruzione) – alto rischio**: sono ad alto rischio i sistemi usati per valutare i risultati dell'apprendimento, orientare il percorso o determinare l'accesso nelle istituzioni educative. In **uso privato** come supporto allo studio l'app non dovrebbe rientrarvi; se una scuola o un ente la usasse per **valutare** gli studenti potrebbe rientrarvi → va evitato o gestito con gli obblighi previsti (gestione del rischio, supervisione umana, documentazione).
  Per questo la verifica del "tentativo serio" serve solo a sbloccare la soluzione e **non produce voti**.
- **Art. 50 – trasparenza**: l'utente deve sapere che interagisce con un'IA e che i contenuti sono generati → avviso su ogni scheda.
- **Art. 4 – alfabetizzazione IA**: chi adotta il sistema (es. ente/scuola) deve formare chi lo usa.

### Legge italiana sull'IA (L. 23 settembre 2025, n. 132)
- Prevede che i **minori di 14 anni** accedano a tecnologie di IA con il **consenso di chi esercita la responsabilità genitoriale** (da verificare il testo vigente con un legale). Coerente con la schermata iniziale dell'app.

### Diritto d'autore (L. 633/1941)
- Fotografare il proprio libro per studio personale è in genere uso personale. L'app non conserva né esporta le foto; le schede sono rielaborazioni sintetiche. Per un servizio pubblico, verificare con un legale (es. accordi con editori).

### Accessibilità
- Per enti pubblici o servizi rientranti nell'European Accessibility Act (D.Lgs. 82/2022): requisiti WCAG 2.1 AA / EN 301 549. L'app usa testi alternativi, contrasto, navigazione da tastiera e `prefers-reduced-motion`; serve un audit formale.

### Policy del fornitore IA
- Rispettare l'**Usage Policy di Anthropic**, che per prodotti destinati a minori richiede salvaguardie aggiuntive (verifica età, moderazione, informativa). Verificare i termini commerciali vigenti su conservazione dei dati e non-utilizzo per l'addestramento; valutare la *zero data retention* se disponibile.

## 3. Checklist prima di un pilota con un ente

- [ ] Parere legale/DPO e **DPIA**
- [ ] Informativa privacy completa + moduli di consenso genitori
- [ ] DPA con Anthropic, verifica trasferimenti extra-UE
- [ ] Server in hosting UE con HTTPS, `APP_ACCESS_CODE` o login, monitoraggio costi
- [ ] Revisione pedagogica (vedi `PEDAGOGIA.md`) e test su schede reali
- [ ] Audit di accessibilità
- [ ] Procedura per segnalare contenuti errati o inadeguati
- [ ] Formazione di docenti e famiglie (art. 4 AI Act)
