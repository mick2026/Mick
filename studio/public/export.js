// Export di una scheda come file HTML autonomo (da inviare, aprire offline, stampare).
import { renderScheda, attivaBase, etichetteBase, esc } from "./render.js";
import { lang } from "./i18n.js";

const jsonSicuro = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

export async function esportaHTML(scheda) {
  const css = await (await fetch("styles.css")).text();
  const vf = (scheda.vero_falso ?? []).map(({ vero, spiegazione }) => ({ vero, spiegazione }));
  const html = `<!doctype html>
<html lang="${lang()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(scheda.titolo)}</title>
<style>${css}</style>
</head>
<body class="export">
<main class="wrap">${renderScheda(scheda, "export")}</main>
<script>(${attivaBase.toString()})(document.body, ${jsonSicuro(vf)}, ${jsonSicuro(etichetteBase())});</script>
</body>
</html>`;
  const nome = `${scheda.creata.slice(0, 10)}-${scheda.materia}-${scheda.titolo}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const file = new File([html], `${nome}.html`, { type: "text/html" });
  // Sul telefono apre il menu di condivisione (WhatsApp, mail...), altrimenti scarica il file.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      return await navigator.share({ files: [file], title: scheda.titolo });
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  scarica(file, file.name);
}

export function scarica(blob, nome) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
