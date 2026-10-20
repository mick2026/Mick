// Login con codice via email. In produzione lo gestisce Supabase Auth; in locale ("dev") un finto login.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export class AuthError extends Error {}

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const opzioniClient = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

function sessione(s) {
  return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at };
}

export function creaAuthSupabase({ url, chiavePubblica, chiaveSegreta }) {
  const pubblico = () => createClient(url, chiavePubblica, opzioniClient);
  const admin = createClient(url, chiaveSegreta, opzioniClient);
  // Cache breve per non chiedere a Supabase chi è l'utente a ogni richiesta.
  const cache = new Map();

  return {
    async inviaCodice(email) {
      const { error } = await pubblico().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw new AuthError(error.status === 429 ? "Troppe richieste di codice: aspetta qualche minuto." : "Non riesco a mandare il codice.");
      return {};
    },
    async verificaCodice(email, codice) {
      const { data, error } = await pubblico().auth.verifyOtp({ email, token: codice, type: "email" });
      if (error || !data?.session) throw new AuthError("Codice non valido o scaduto.");
      return sessione(data.session);
    },
    async rinnova(refreshToken) {
      const { data, error } = await pubblico().auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data?.session) throw new AuthError("Sessione scaduta: accedi di nuovo.");
      return sessione(data.session);
    },
    async utente(token) {
      const k = sha(token);
      const c = cache.get(k);
      if (c && c.scade > Date.now()) return c.utente;
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data?.user) return null;
      const utente = { id: data.user.id, email: data.user.email ?? "" };
      if (cache.size > 5000) cache.clear();
      cache.set(k, { utente, scade: Date.now() + 60_000 });
      return utente;
    },
    async esci(token) {
      cache.delete(sha(token));
      await admin.auth.admin.signOut(token).catch(() => {});
    },
    async eliminaUtente(id) {
      cache.clear();
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw new Error("Eliminazione account non riuscita.");
    },
  };
}

// Login finto per prove in locale: il codice viene stampato nel terminale e mostrato nell'app.
export function creaAuthDev() {
  const segreto = crypto.randomBytes(32);
  const codici = new Map();
  const revocati = new Set();
  const firma = (dati) => {
    const corpo = Buffer.from(JSON.stringify(dati)).toString("base64url");
    return `${corpo}.${crypto.createHmac("sha256", segreto).update(corpo).digest("base64url")}`;
  };
  const leggi = (token, tipo) => {
    const [corpo, f] = String(token).split(".");
    if (!corpo || !f) return null;
    const atteso = crypto.createHmac("sha256", segreto).update(corpo).digest("base64url");
    if (f.length !== atteso.length || !crypto.timingSafeEqual(Buffer.from(f), Buffer.from(atteso))) return null;
    let d;
    try {
      d = JSON.parse(Buffer.from(corpo, "base64url").toString());
    } catch {
      return null;
    }
    return d.tipo === tipo && d.scade > Date.now() && !revocati.has(token) ? d : null;
  };
  const idDaEmail = (email) => {
    const h = sha("dev:" + email);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  };
  const nuovaSessione = (email) => {
    const scade = Date.now() + 3600_000;
    return {
      access_token: firma({ tipo: "accesso", id: idDaEmail(email), email, scade, n: crypto.randomUUID() }),
      refresh_token: firma({ tipo: "rinnovo", email, scade: Date.now() + 30 * 86400_000, n: crypto.randomUUID() }),
      expires_at: Math.floor(scade / 1000),
    };
  };

  return {
    async inviaCodice(email) {
      const codice = String(crypto.randomInt(100000, 1000000));
      codici.set(email, { codice, scade: Date.now() + 10 * 60_000, tentativi: 0 });
      console.log(`[login di prova] codice per ${email}: ${codice}`);
      return { codiceDev: codice };
    },
    async verificaCodice(email, codice) {
      const c = codici.get(email);
      if (!c || c.scade < Date.now() || ++c.tentativi > 5 || c.codice !== codice) throw new AuthError("Codice non valido o scaduto.");
      codici.delete(email);
      return nuovaSessione(email);
    },
    async rinnova(refreshToken) {
      const d = leggi(refreshToken, "rinnovo");
      if (!d) throw new AuthError("Sessione scaduta: accedi di nuovo.");
      revocati.add(refreshToken);
      return nuovaSessione(d.email);
    },
    async utente(token) {
      const d = leggi(token, "accesso");
      return d ? { id: d.id, email: d.email } : null;
    },
    async esci(token) {
      revocati.add(token);
    },
    async eliminaUtente() {},
  };
}
