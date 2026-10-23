// Archivio in memoria per prove locali e test. Con STORE_FILE i dati sopravvivono al riavvio.
import fs from "node:fs";
import crypto from "node:crypto";

export function creaStoreMemoria(file = "") {
  let db = { famiglie: {}, profili: {}, schede: {}, utilizzo: {} };
  if (file && fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, "utf8"));
  const persisti = () => file && fs.writeFileSync(file, JSON.stringify(db));
  const copia = (o) => (o == null ? null : structuredClone(o));
  const ora = () => new Date().toISOString();

  return {
    async famiglia(id, email) {
      db.famiglie[id] ??= { id, email: null, creata: ora(), piano: "prova", abbonamento_scade: null, consenso_versione: null, consenso_at: null };
      if (email) db.famiglie[id].email = email;
      persisti();
      return copia(db.famiglie[id]);
    },
    async salvaConsenso(fid, versione) {
      Object.assign(db.famiglie[fid], { consenso_versione: versione, consenso_at: ora() });
      persisti();
    },

    async profili(fid) {
      return Object.values(db.profili).filter((p) => p.famiglia_id === fid).sort((a, b) => a.creato.localeCompare(b.creato)).map(copia);
    },
    async creaProfilo(fid, campi) {
      const p = { id: crypto.randomUUID(), famiglia_id: fid, creato: ora(), ...campi };
      db.profili[p.id] = p;
      persisti();
      return copia(p);
    },
    async aggiornaProfilo(fid, pid, campi) {
      const p = db.profili[pid];
      if (!p || p.famiglia_id !== fid) return null;
      Object.assign(p, campi);
      persisti();
      return copia(p);
    },
    async eliminaProfilo(fid, pid) {
      if (db.profili[pid]?.famiglia_id !== fid) return;
      delete db.profili[pid];
      for (const [id, s] of Object.entries(db.schede)) if (s.profilo_id === pid) delete db.schede[id];
      persisti();
    },

    async elencoSchede(fid, pid) {
      return Object.values(db.schede)
        .filter((s) => s.famiglia_id === fid && s.profilo_id === pid)
        .sort((a, b) => b.creata.localeCompare(a.creata))
        .map(({ dati, ...riga }) => copia(riga));
    },
    async leggiScheda(fid, id) {
      const s = db.schede[id];
      return s && s.famiglia_id === fid ? copia(s) : null;
    },
    async schedePerId(fid, ids) {
      return ids.map((id) => db.schede[id]).filter((s) => s && s.famiglia_id === fid).map(copia);
    },
    async creaScheda(riga) {
      const s = { id: crypto.randomUUID(), creata: ora(), aggiornata: ora(), ...riga };
      db.schede[s.id] = s;
      persisti();
      return copia(s);
    },
    async aggiornaScheda(fid, id, campi) {
      const s = db.schede[id];
      if (!s || s.famiglia_id !== fid) return null;
      Object.assign(s, campi, { aggiornata: ora() });
      persisti();
      return copia(s);
    },
    async eliminaScheda(fid, id) {
      if (db.schede[id]?.famiglia_id === fid) delete db.schede[id];
      persisti();
    },

    async utilizzo(fid, mese) {
      return copia(db.utilizzo[`${fid}|${mese}`] ?? { schede: 0, verifiche: 0 });
    },
    // Scala (delta > 0) o restituisce (delta < 0) una quota; false se il limite è raggiunto.
    async consuma(fid, mese, tipo, limite, delta = 1) {
      const k = `${fid}|${mese}`;
      const u = (db.utilizzo[k] ??= { schede: 0, verifiche: 0 });
      if (delta > 0 && u[tipo] + delta > limite) return false;
      u[tipo] = Math.max(0, u[tipo] + delta);
      persisti();
      return true;
    },

    // Area amministrazione: dati di servizio, senza nomi dei ragazzi né contenuto delle schede.
    async elencoFamiglie(mese) {
      const conta = (t, fid) => Object.values(db[t]).filter((r) => r.famiglia_id === fid).length;
      return Object.values(db.famiglie)
        .map((f) => ({
          ...copia(f),
          profili: conta("profili", f.id),
          schede: conta("schede", f.id),
          mese: copia(db.utilizzo[`${f.id}|${mese}`] ?? { schede: 0, verifiche: 0 }),
        }))
        .sort((a, b) => b.creata.localeCompare(a.creata));
    },
    async aggiornaPiano(fid, campi) {
      if (!db.famiglie[fid]) return null;
      Object.assign(db.famiglie[fid], campi);
      persisti();
      return copia(db.famiglie[fid]);
    },

    async esporta(fid) {
      return {
        famiglia: copia(db.famiglie[fid]),
        profili: await this.profili(fid),
        schede: Object.values(db.schede).filter((s) => s.famiglia_id === fid).map(copia),
        utilizzo: Object.entries(db.utilizzo).filter(([k]) => k.startsWith(fid + "|")).map(([k, v]) => ({ mese: k.split("|")[1], ...v })),
      };
    },
    async eliminaFamiglia(fid) {
      delete db.famiglie[fid];
      for (const t of ["profili", "schede"]) for (const [id, r] of Object.entries(db[t])) if (r.famiglia_id === fid) delete db[t][id];
      for (const k of Object.keys(db.utilizzo)) if (k.startsWith(fid + "|")) delete db.utilizzo[k];
      persisti();
    },
  };
}
