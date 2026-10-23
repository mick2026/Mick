// Ridimensiona e ricodifica le foto in JPEG: riduce il peso e rimuove i metadati EXIF (es. posizione GPS).
const MAX_LATO = 1600;

export async function preparaImmagine(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scala = Math.min(1, MAX_LATO / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scala);
  canvas.height = Math.round(bmp.height * scala);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mediaType: "image/jpeg", data: dataUrl.split(",")[1], anteprima: dataUrl };
}
