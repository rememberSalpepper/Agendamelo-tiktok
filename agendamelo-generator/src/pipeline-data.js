export function rowToData(row) {
  const content = JSON.parse(row.imagen_json);
  const num = parseInt(String(row.id).replace(/\D/g, ''), 10) || 1;
  const bg = content.bg || ((num - 1) % 4) + 1;

  // En carruseles, la portada vive dentro de slides[0]. El hook curado del CSV
  // debe reemplazar el hook preliminar generado, igual que ocurre en imágenes.
  if (row.hook && Array.isArray(content.slides) && content.slides.length > 0) {
    content.slides = content.slides.map((slide, index) => (
      index === 0 ? { ...slide, hook: row.hook } : slide
    ));
  }

  return { tipo: row.tipo_plantilla, niche: row.niche, ...content, hook: row.hook, bg };
}
