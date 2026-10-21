import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export async function watermarkPdf(bytes: ArrayBuffer, name: string) {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  // Standard PDF fonts cannot encode every Unicode character.
  const safeName = Array.from(name.normalize("NFKC"))
    .map((character) => {
      try { font.encodeText(character); return character; }
      catch { return "?"; }
    }).join("").replace(/[\r\n]/g, " ").slice(0, 100);
  const text = `${safeName || "Pengguna"} - DokterAmbis`;
  for (const page of pdf.getPages()) {
    const { x, y, width, height } = page.getCropBox();
    const size = Math.min(18, width * 0.8 / font.widthOfTextAtSize(text, 1));
    const textWidth = font.widthOfTextAtSize(text, size);
    for (const fraction of [0.2, 0.5, 0.8]) {
      page.drawText(text, {
        x: x + (width - textWidth * Math.cos(Math.PI / 6)) / 2,
        y: y + height * fraction,
        size, font, rotate: degrees(30),
        color: rgb(0.2, 0.26, 0.33), opacity: 0.16,
      });
    }
  }
  return pdf.save();
}
