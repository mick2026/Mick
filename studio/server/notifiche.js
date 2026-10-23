// Email di servizio (avvisi all'amministratore, conferma di approvazione) tramite l'API web di Brevo.
// Si usa l'API HTTPS e non SMTP: alcuni hosting bloccano le porte SMTP in uscita.
import { CONFIG } from "./config.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function invia({ a, oggetto, html }) {
  const { apiKey, apiUrl, mittente } = CONFIG.email;
  if (!apiKey || !mittente || !a.length) return false;
  try {
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Studio Amico", email: mittente },
        to: a.map((email) => ({ email })),
        subject: oggetto,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error(`[email] Brevo ha risposto ${r.status}:`, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (e) {
    console.error("[email] invio non riuscito:", e.message);
    return false;
  }
}

const pagina = (corpo) =>
  `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1F2430;max-width:520px">${corpo}
  <p style="color:#5A6170;font-size:13px">Studio Amico</p></div>`;

const pulsante = (href, testo) =>
  !/^https?:\/\//.test(href) ? "" : `<p><a href="${esc(href)}" style="display:inline-block;background:#2B4C7E;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">${esc(testo)}</a></p>`;

export function avvisaNuovaIscrizione(emailIscritto, origine) {
  return invia({
    a: CONFIG.email.avvisi,
    oggetto: "Nuova iscrizione da approvare",
    html: pagina(`<h2>🦉 Nuova iscrizione</h2>
      <p><strong>${esc(emailIscritto)}</strong> si è iscritto/a e ha dato il consenso: è in attesa di approvazione.</p>
      ${pulsante(origine + "/#/admin", "Apri l'Amministrazione")}`),
  });
}

export function avvisaApprovazione(emailIscritto, origine) {
  return invia({
    a: [emailIscritto],
    oggetto: "Il tuo accesso a Studio Amico è attivo",
    html: pagina(`<h2>🦉 Accesso approvato</h2>
      <p>Il tuo accesso a Studio Amico è stato approvato: puoi creare il profilo di chi studia e la prima scheda.</p>
      ${pulsante(origine + "/", "Apri Studio Amico")}`),
  });
}
