// Archivio su Supabase (Postgres). Il server usa la chiave segreta: le tabelle hanno RLS attiva senza
// regole, quindi nessuno può leggerle dall'esterno. Ogni query filtra comunque per famiglia_id.
import { createClient } from "@supabase/supabase-js";

const RIGA_ELENCO = "id, famiglia_id, profilo_id, materia, tipo, titolo, creata, aggiornata, riepilogo";

export function creaStoreSupabase({ url, chiaveSegreta }) {
  const sb = createClient(url, chiaveSegreta, { auth: { persistSession: false, autoRefreshToken: false } });
  const ok = ({ data, error }) => {
    if (error) throw new Error(`Database: ${error.message}`);
    return data;
  };

  return {
    async famiglia(id, email) {
      ok(await sb.from("famiglie").upsert({ id }, { onConflict: "id", ignoreDuplicates: true }));
      // L'email serve all'area amministrazione (colonna aggiunta da 002_email_famiglie.sql).
      if (email) {
        const { error } = await sb.from("famiglie").update({ email }).eq("id", id);
        if (error) console.error("[db] email della famiglia non salvata:", error.message);
      }
      return ok(await sb.from("famiglie").select("*").eq("id", id).single());
    },
    async salvaConsenso(fid, versione) {
      ok(await sb.from("famiglie").update({ consenso_versione: versione, consenso_at: new Date().toISOString() }).eq("id", fid));
    },

    async profili(fid) {
      return ok(await sb.from("profili").select("*").eq("famiglia_id", fid).order("creato"));
    },
    async creaProfilo(fid, campi) {
      return ok(await sb.from("profili").insert({ ...campi, famiglia_id: fid }).select().single());
    },
    async aggiornaProfilo(fid, pid, campi) {
      return ok(await sb.from("profili").update(campi).eq("famiglia_id", fid).eq("id", pid).select().maybeSingle());
    },
    async eliminaProfilo(fid, pid) {
      ok(await sb.from("profili").delete().eq("famiglia_id", fid).eq("id", pid));
    },

    async elencoSchede(fid, pid) {
      return ok(await sb.from("schede").select(RIGA_ELENCO).eq("famiglia_id", fid).eq("profilo_id", pid).order("creata", { ascending: false }));
    },
    async leggiScheda(fid, id) {
      return ok(await sb.from("schede").select("*").eq("famiglia_id", fid).eq("id", id).maybeSingle());
    },
    async schedePerId(fid, ids) {
      return ids.length ? ok(await sb.from("schede").select("*").eq("famiglia_id", fid).in("id", ids)) : [];
    },
    async creaScheda(riga) {
      return ok(await sb.from("schede").insert(riga).select().single());
    },
    async aggiornaScheda(fid, id, campi) {
      return ok(
        await sb.from("schede").update({ ...campi, aggiornata: new Date().toISOString() }).eq("famiglia_id", fid).eq("id", id).select().maybeSingle(),
      );
    },
    async eliminaScheda(fid, id) {
      ok(await sb.from("schede").delete().eq("famiglia_id", fid).eq("id", id));
    },

    async utilizzo(fid, mese) {
      const r = ok(await sb.from("utilizzo").select("schede, verifiche").eq("famiglia_id", fid).eq("mese", mese).maybeSingle());
      return r ?? { schede: 0, verifiche: 0 };
    },
    // Atomico lato database (funzione consuma_quota): due richieste insieme non superano il limite.
    async consuma(fid, mese, tipo, limite, delta = 1) {
      return ok(await sb.rpc("consuma_quota", { p_famiglia: fid, p_mese: mese, p_tipo: tipo, p_limite: limite, p_delta: delta })) === true;
    },

    // Area amministrazione: dati di servizio, senza nomi dei ragazzi né contenuto delle schede.
    async elencoFamiglie(mese) {
      const [famiglie, uso] = await Promise.all([
        sb.from("famiglie").select("id, email, creata, piano, abbonamento_scade, consenso_versione, consenso_at, profili(count), schede(count)").order("creata", { ascending: false }).then(ok),
        sb.from("utilizzo").select("famiglia_id, schede, verifiche").eq("mese", mese).then(ok),
      ]);
      const perFamiglia = new Map(uso.map((u) => [u.famiglia_id, { schede: u.schede, verifiche: u.verifiche }]));
      return famiglie.map((f) => ({
        ...f,
        profili: f.profili?.[0]?.count ?? 0,
        schede: f.schede?.[0]?.count ?? 0,
        mese: perFamiglia.get(f.id) ?? { schede: 0, verifiche: 0 },
      }));
    },
    async aggiornaPiano(fid, campi) {
      return ok(await sb.from("famiglie").update(campi).eq("id", fid).select().maybeSingle());
    },

    async esporta(fid) {
      const [famiglia, profili, schede, utilizzo] = await Promise.all([
        sb.from("famiglie").select("*").eq("id", fid).single().then(ok),
        sb.from("profili").select("*").eq("famiglia_id", fid).then(ok),
        sb.from("schede").select("*").eq("famiglia_id", fid).then(ok),
        sb.from("utilizzo").select("*").eq("famiglia_id", fid).then(ok),
      ]);
      return { famiglia, profili, schede, utilizzo };
    },
    // Le altre tabelle si svuotano a cascata (vedi supabase/migrations).
    async eliminaFamiglia(fid) {
      ok(await sb.from("famiglie").delete().eq("id", fid));
    },
  };
}
