// OCR service — wrapper nad node-tesseract-ocr.
//
// Princípy (viď PROJECT.md §4.5 + Sprint 3b spec):
// - Jazyk LEN "eng". Slovenský pack pridáme až po reálnom teste presnosti.
// - Idempotentné: processPhoto pre fotku ktorá nie je PENDING jednoducho skipne.
//   Tým chránime DONE/FAILED fotky pred náhodným prepísaním pri opätovnom
//   spustení batchu alebo race condition.
// - Sériové spracovanie v processPending (await v cykle, NIE Promise.all).
//   Tesseract je CPU-bound; paralelizmus na malom Railway containere by
//   spôsobil thrash a celkové spomalenie.
// - Nikdy nevyhadzujeme error nahor z processPhoto — každá fotka sa rieši
//   samostatne, aby jedna pokazená nezhodila celý batch.

import tesseract from "node-tesseract-ocr";
import { getObjectAsBuffer } from "./r2.js";
import { prisma } from "../prisma.js";

// PSM 1 = "Automatic page segmentation with OSD" (Orientation and Script
// Detection). Tesseract pred OCR automaticky detekuje rotáciu fotky a pootočí
// si vstup. POVINNÉ: musí byť nainštalovaný `tesseract-ocr-osd` apt package
// (osd.traineddata) — viď backend/railpack.json. Bez OSD packagu PSM 1 zhodí
// proces s chybou "Unable to load osd.traineddata" a každá fotka skončí FAILED.
//
// Pôvodne sme mali PSM 6 (uniform block of text) ale nálepky/štítky bývajú
// nafotené pod rôznymi uhlami (chrbty zložiek = 90°, krabice naležato = 180°,
// telefón v ruke = 0-15° náklon). PSM 1 toto vie samo zarovnať.
//
// Jazyk "slk+eng" — Tesseract paralelne načíta slovenský aj anglický slovník.
// Pri každom slove vyberie jazyk s vyššou confidence. Slovenský je primárny
// (väčšina štítkov), eng je fallback pre skratky a anglické termíny.
// POVINNÉ: tesseract-ocr-slk + tesseract-ocr-eng apt packages v railpack.json.
const TESSERACT_CONFIG = {
  lang: "slk+eng",
  oem: 1, // LSTM OCR engine — modernejší než legacy.
  psm: 1, // Auto segmentation + OSD orientation detection.
};

/**
 * Spustí OCR nad jednou fotkou a uloží výsledok do DB.
 * Idempotentné — fotka mimo stavu PENDING sa preskočí.
 * Nikdy nevyhadzuje error; chyby loguje cez console.error.
 */
export async function processPhoto(photoId: string): Promise<void> {
  try {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, deleted_at: null },
      select: { id: true, storage_key: true, ocr_status: true },
    });

    if (!photo) {
      console.warn(`[ocr] processPhoto: photo ${photoId} not found or deleted`);
      return;
    }

    // Idempotencia: respektujeme aktuálny stav. Caller musí najprv nastaviť
    // PENDING (napr. retry endpoint) ak chce re-OCR.
    if (photo.ocr_status !== "PENDING") {
      return;
    }

    let text: string;
    try {
      const buffer = await getObjectAsBuffer(photo.storage_key);
      const raw = await tesseract.recognize(buffer, TESSERACT_CONFIG);
      text = raw.trim();
    } catch (err) {
      console.error(`[ocr] photo ${photoId} OCR failed:`, err);
      await prisma.photo.update({
        where: { id: photoId },
        data: { ocr_status: "FAILED", ocr_raw_text: null },
      });
      return;
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: { ocr_status: "DONE", ocr_raw_text: text },
    });
  } catch (err) {
    // Posledná obrana — chyba v DB query alebo niečo nečakané.
    console.error(`[ocr] processPhoto ${photoId} unexpected error:`, err);
  }
}

/**
 * Spracuje až `limit` PENDING fotiek sériovo.
 * Vracia počty processed (DONE) / failed (FAILED).
 */
export async function processPending(
  limit = 50,
): Promise<{ processed: number; failed: number }> {
  const photos = await prisma.photo.findMany({
    where: { ocr_status: "PENDING", deleted_at: null },
    orderBy: { created_at: "asc" },
    take: limit,
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;

  for (const p of photos) {
    await processPhoto(p.id);
    // Po processPhoto sa stav zmení na DONE alebo FAILED — overíme znovu
    // (idempotentne, čítame čerstvý stav z DB) aby sme spočítali správne.
    const after = await prisma.photo.findUnique({
      where: { id: p.id },
      select: { ocr_status: true },
    });
    if (after?.ocr_status === "DONE") processed += 1;
    else if (after?.ocr_status === "FAILED") failed += 1;
  }

  console.log(
    `[ocr] processPending finished: ${processed} done, ${failed} failed (of ${photos.length} attempted)`,
  );
  return { processed, failed };
}
