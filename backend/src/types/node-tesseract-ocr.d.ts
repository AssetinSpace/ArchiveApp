// Type declaration pre node-tesseract-ocr (oficiálne @types/node-tesseract-ocr neexistuje).
// Tento súbor pickne TS automaticky cez tsconfig.json `include: ["src/**/*"]`.
//
// Knižnica volá systémový `tesseract` binary cez child_process; je to len tenký
// wrapper. Real API: https://github.com/zapolnoch/node-tesseract-ocr

declare module "node-tesseract-ocr" {
  export interface Config {
    /** Jazyk(y) — napr. "eng", "slk", "eng+slk". Default: "eng". */
    lang?: string;
    /** OCR Engine Mode: 0=legacy, 1=LSTM, 2=legacy+LSTM, 3=default. */
    oem?: number;
    /** Page Segmentation Mode: 0-13 (6 = uniform block of text). */
    psm?: number;
    /** Cesta k vlastnému tessdata adresáru, ak treba override. */
    tessdataDir?: string;
    /** Vlastný cesta k tesseract binary (default: nájdený v PATH). */
    binary?: string;
    /** Ďalšie tesseract CLI flagy (key=value), pass-through. */
    [key: string]: string | number | boolean | undefined;
  }

  /**
   * Spustí tesseract OCR nad obrázkom a vráti rozpoznaný text.
   * @param image cesta k súboru, Buffer s image dátami, alebo pole ciest (batch)
   */
  export function recognize(
    image: string | Buffer | string[],
    config?: Config,
  ): Promise<string>;
}
