# Pubblicare Studio Amico online

Guida passo passo per mettere online la versione con login, indipendente dal tuo account claude.ai.
Tempo indicativo: 1–2 ore la prima volta. Le voci dei menu dei vari servizi cambiano spesso:
se non trovi un nome esatto, cerca la voce più simile.

```
Telefono ──► Server Studio Amico (Render/Fly, Francoforte) ──► API Anthropic (la tua chiave)
                         │
                         └──► Supabase (Francoforte): login con codice email + database
```

## 0. Prima di iniziare

- Un indirizzo email "di servizio" (es. studioamico@tuodominio.it).
- Per vendere abbonamenti (fase successiva): partita IVA o società e un commercialista.
- Leggi `docs/PRIVACY-SICUREZZA.md`: per offrire il servizio ad altre famiglie servono informativa,
  termini d'uso e una valutazione d'impatto (DPIA). Fatti aiutare da un legale/DPO.

## 1. Anthropic: la chiave per Claude

1. Vai su **console.anthropic.com** e crea un account (meglio intestato all'attività, non quello personale).
2. In **Billing** aggiungi un metodo di pagamento e un po' di credito.
3. In **Limits** imposta un **tetto di spesa mensile** (es. 50 $): protegge da sorprese.
4. In **API Keys** crea una chiave chiamata `studio-amico-produzione` e copiala in un posto sicuro.
   Non va mai messa nel codice, in chat o su GitHub.

## 2. Supabase: login e database

1. Vai su **supabase.com**, crea un account e un **nuovo progetto**:
   - Regione: **Central EU (Frankfurt)**.
   - Password del database: generala e conservala.
2. Apri **SQL Editor**, incolla tutto il file `supabase/migrations/001_iniziale.sql` e premi **Run**.
   Crea le tabelle (famiglie, profili, schede, utilizzo) chiuse a chiunque tranne il server.
3. **Authentication → Sign In / Providers → Email**: lascia attivo Email.
   - Imposta la lunghezza del codice (**Email OTP Length**) a **6**.
   - Scadenza del codice: 10 minuti (600 secondi) va bene.
4. **Authentication → Emails (Templates)**: nei modelli **Magic Link** e **Confirm signup** sostituisci il
   testo con qualcosa come:
   ```
   <h2>Il tuo codice per Studio Amico</h2>
   <p>Inserisci questo codice nell'app: <strong>{{ .Token }}</strong></p>
   <p>Se non l'hai chiesto tu, ignora questa email.</p>
   ```
   Senza `{{ .Token }}` arriverebbe un link invece del codice.
5. **Authentication → SMTP**: configura un servizio di invio email (es. Brevo, Postmark, Resend).
   Il servizio email incluso in Supabase è solo per prove e non manda email a utenti qualsiasi.
6. **Project Settings → API Keys**: copia
   - **Project URL** → sarà `SUPABASE_URL`
   - **Publishable key** → `SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** → `SUPABASE_SECRET_KEY` (segreta: dà accesso a tutto il database).
7. **Authentication → URL Configuration**: in **Site URL** metti l'indirizzo dell'app (dopo il passo 3).

## 3a. Render (consigliato: il più semplice)

1. Crea un account su **render.com** collegandolo a GitHub.
2. **New → Blueprint**, scegli il repository `mick2026/Mick` e il branch con l'app.
   Render legge `render.yaml` (nella radice del repository) e propone il servizio `studio-amico`
   a Francoforte.
3. Ti chiede i valori segreti: incolla `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
4. Premi **Apply**. Dopo qualche minuto l'app è su `https://studio-amico.onrender.com` (o simile).
5. Prova `https://…/api/salute`: deve rispondere `{"ok":true}`.

Il piano `starter` costa circa 7 $/mese e resta sempre acceso. Il piano gratuito si "addormenta" e la
prima apertura dopo una pausa è lenta: va bene solo per prove.

## 3b. Fly.io (alternativa)

```bash
# una volta: installa flyctl e accedi
fly launch --no-deploy --copy-config --name studio-amico --region fra   # dalla cartella studio/
fly secrets set ANTHROPIC_API_KEY=... SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=...
fly deploy
```

## 4. Dominio (facoltativo ma consigliato)

1. Compra un dominio (es. `studioamico.it`) da un registrar.
2. In Render: **Settings → Custom Domains** (in Fly: `fly certs add`), segui le istruzioni DNS.
   Il certificato HTTPS è automatico.
3. Aggiorna **Site URL** in Supabase con il nuovo indirizzo.

## 5. Primo collaudo

1. Apri l'app dal telefono, inserisci la tua email, ricevi il codice, entra.
2. Conferma il consenso del genitore, crea il profilo di Tommaso, crea una scheda vera.
3. In Supabase → **Table Editor** controlla che ci siano una riga in `famiglie`, una in `profili`,
   una in `schede`, e che `utilizzo` segni 1.
4. Da Chrome sul telefono: menu ⋮ → **Installa app**: compare l'icona 🦉.
5. Prova anche **Impostazioni → Scarica tutti i dati** ed **Elimina account** con un account di prova.

## Impostazioni utili

| Variabile | Default | Significato |
|---|---|---|
| `LIMITE_PROVA` | 5 | schede al mese per famiglia in prova |
| `LIMITE_ABBONATO` | 40 | schede al mese con abbonamento (pagamenti: fase successiva) |
| `VERIFICHE_PER_SCHEDA` | 3 | controlli dei tentativi al mese = limite schede × questo numero |
| `CLAUDE_MODEL` | `claude-opus-5-5` | modello usato |
| `CLAUDE_EFFORT` | `medium` | profondità di ragionamento |

Per passare a mano una famiglia ad "abbonato" (prima dei pagamenti automatici): in Supabase,
tabella `famiglie`, imposta `piano = abbonato` e, se vuoi, `abbonamento_scade`.

## Costi indicativi all'avvio

| Voce | Costo |
|---|---|
| Render starter | ~7 $/mese |
| Supabase | gratis fino a uso moderato; piano Pro ~25 $/mese quando cresce |
| Email (Brevo/Resend) | gratis per poche centinaia di email al mese |
| Dominio `.it` | ~10–15 €/anno |
| Claude | ~0,10–0,30 $ a scheda (da misurare) |

## Sicurezza: cosa è già fatto e cosa controllare

Già nel codice:
- la chiave Anthropic e la chiave segreta Supabase stanno solo sul server;
- le tabelle hanno RLS attiva senza regole, quindi dall'esterno non si leggono;
- ogni richiesta è filtrata per famiglia, e un test automatico verifica che una famiglia non veda i
  dati di un'altra;
- i limiti mensili si scalano in modo atomico nel database;
- in produzione il server si rifiuta di partire con il login di prova o senza chiavi;
- HTTPS obbligatorio (HSTS), Content-Security-Policy restrittiva, limiti di frequenza sulle richieste;
- nessun contenuto degli studenti nei log; le foto non vengono salvate.

Da controllare tu:
- tetto di spesa su Anthropic;
- backup automatici del database (inclusi nei piani a pagamento di Supabase);
- i limiti di frequenza sono in memoria: con più istanze del server ognuna conta per sé (per partire
  basta un'istanza);
- quando si aggiungono i pagamenti, la chiave segreta di Stripe va aggiunta allo stesso modo.
