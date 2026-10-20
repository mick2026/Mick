// Archivio locale (IndexedDB): le schede restano solo su questo dispositivo.
const DB = "studio-amico";
const STORE = "schede";

let dbp;
function apri() {
  dbp ??= new Promise((ok, ko) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const s = r.result.createObjectStore(STORE, { keyPath: "id" });
      s.createIndex("materia", "materia");
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
  return dbp;
}

async function tx(mode, fn) {
  const db = await apri();
  return new Promise((ok, ko) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => ok(req?.result);
    t.onerror = () => ko(t.error);
  });
}

export const salva = (scheda) => tx("readwrite", (s) => s.put(scheda));
export const leggi = (id) => tx("readonly", (s) => s.get(id));
export const elimina = (id) => tx("readwrite", (s) => s.delete(id));
export const svuota = () => tx("readwrite", (s) => s.clear());
export const tutte = async () =>
  ((await tx("readonly", (s) => s.getAll())) ?? []).sort((a, b) => b.creata.localeCompare(a.creata));

// Impostazioni (preferenze non sensibili) in localStorage, con fallback in memoria.
const mem = {};
export function pref(k, v) {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem("sa." + k) ?? "null") ?? mem[k];
    localStorage.setItem("sa." + k, JSON.stringify(v));
  } catch {
    if (v === undefined) return mem[k];
  }
  mem[k] = v;
}
export function cancellaPref() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("sa.")).forEach((k) => localStorage.removeItem(k));
  } catch {}
  Object.keys(mem).forEach((k) => delete mem[k]);
}
