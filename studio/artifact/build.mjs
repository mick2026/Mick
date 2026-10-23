// Costruisce artifact/studio-amico.html (un solo file) dai sorgenti condivisi con la versione server.
// Uso: node artifact/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const leggi = (p) => fs.readFileSync(path.join(root, p), "utf8");

// Ogni modulo diventa una funzione che restituisce solo ciò che esporta:
// i nomi interni (es. helper con lo stesso nome in file diversi) non si scontrano.
function modulo(p) {
  const src = leggi(p).replace(/^import[\s\S]*?from\s+["'][^"']+["'];\n/gm, "");
  const nomi = [...src.matchAll(/^export (?:const|function|async function|class|let) (\w+)/gm)].map((m) => m[1]);
  const corpo = src.replace(/^export (const|function|async function|class|let) /gm, "$1 ");
  return `// ---- ${p} ----\nconst { ${nomi.join(", ")} } = (() => {\n${corpo}\nreturn { ${nomi.join(", ")} };\n})();`;
}

const js = [
  // Archivio di riserva nel browser (IndexedDB) e preferenze.
  modulo("public/db.js"),
  modulo("public/i18n.js"),
  modulo("public/render.js"),
  modulo("server/pedagogia.js"),
  modulo("server/schemas.js"),
  modulo("server/prompt.js"),
  leggi("artifact/app.js"),
].join("\n");

if (/^\s*(import|export)\s/m.test(js)) throw new Error("import/export rimasti nel bundle");

const css = leggi("public/styles.css") + "\n" + leggi("artifact/extra.css");
const html = leggi("artifact/shell.html")
  .replace("/*CSS*/", () => css)
  .replace("/*JS*/", () => `(() => {\n"use strict";\n${js.replace(/<\/script/gi, "<\\/script")}\n})();`);

const out = path.join(here, "studio-amico.html");
fs.writeFileSync(out, html);
console.log(`Scritto ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB)`);
