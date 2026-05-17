// OCR endpointy — viď PROJECT.md §4.5 a Sprint 3b spec.
//
// Mount: app.use("/api/ocr", basicAuth, ocrRouter) v index.ts.
// Relatívne paths: /process-pending, /status, /retry/:photoId, /failed.
//
// Konvencia odpovedí: snake_case (rovnaký štýl ako /api/items, /api/photos).

import { Router } from "express";
import { execSync } from "node:child_process";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { processPending, processPhoto } from "../services/ocr.js";
import { getSignedUrlForKey } from "../services/r2.js";

export const ocrRouter: Router = Router();

// ─── GET /api/ocr/test-binary ────────────────────────────────────────────────
// DOČASNÝ smoke test — overuje že `tesseract` binary je v runtime PATH
// po Railpack `deploy.aptPackages` inštalácii. Po overení v produkcii ZMAZAŤ
// (commit: "chore: remove ocr test-binary endpoint").
// Basic Auth platí cez index.ts mount; auth check sa tu nerieši separe.

ocrRouter.get("/test-binary", (_req, res) => {
  try {
    const version = execSync("tesseract --version 2>&1", {
      timeout: 5000,
    }).toString();
    res.json({ ok: true, version });
  } catch (e) {
    res.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

// ─── POST /api/ocr/process-pending ────────────────────────────────────────────
//
// Spustí batch asynchrónne na pozadí (setImmediate) a okamžite vráti počet
// fotiek čo boli v stave PENDING v momente volania. Klient pollne /status
// kým pending neklesne na 0.
//
// Nepoužívame queue (Bull/Redis) — pre MVP solo používateľa stačí setImmediate
// jeden batch v procese. Ak by sa volalo viackrát súbežne, druhý beh by si
// zobral už PENDING fotky čo prvý ešte neoznačil; processPhoto je idempotentné.

const ProcessPendingSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
});

ocrRouter.post("/process-pending", async (req, res, next) => {
  try {
    const body = ProcessPendingSchema.parse(req.body ?? {});
    const limit = body.limit ?? 50;

    const pendingCount = await prisma.photo.count({
      where: { ocr_status: "PENDING", deleted_at: null },
    });

    // queuedCount = počet ktorý sa naozaj pokúsi spracovať v tomto behu
    // (= min(pending, limit)). Klient si zapamätá toto číslo pre banner
    // "Hotovo — spracovaných N fotiek".
    const queuedCount = Math.min(pendingCount, limit);

    setImmediate(() => {
      processPending(limit).catch((err) => {
        console.error("[ocr] batch process-pending error:", err);
      });
    });

    res.json({ started: true, queuedCount });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/ocr/status ──────────────────────────────────────────────────────
//
// Vráti počty pre všetky non-deleted fotky. Used pre live polling z FE.

ocrRouter.get("/status", async (_req, res, next) => {
  try {
    const grouped = await prisma.photo.groupBy({
      by: ["ocr_status"],
      where: { deleted_at: null },
      _count: { _all: true },
    });

    let pending = 0;
    let done = 0;
    let failed = 0;
    for (const g of grouped) {
      const count = g._count._all;
      if (g.ocr_status === "PENDING") pending = count;
      else if (g.ocr_status === "DONE") done = count;
      else if (g.ocr_status === "FAILED") failed = count;
    }

    res.json({ pending, done, failed, total: pending + done + failed });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/ocr/retry/:photoId ─────────────────────────────────────────────
//
// Synchronné: resetne stav na PENDING, hneď zavolá processPhoto a vráti
// finálny stav v odpovedi. Klient na FE má disabled tlačidlo počas requestu.
//
// Timeout: Tesseract obvykle 2-5s. Default Express request timeout je 2 min,
// dosť. Na produkcii môže byť proxy timeout ~60s — pre MVP neriešime, ak
// fotka trvá viac, klient dostane network error a používateľ retryne znovu.

ocrRouter.post("/retry/:photoId", async (req, res, next) => {
  try {
    const photoId = String(req.params.photoId);

    const existing = await prisma.photo.findFirst({
      where: { id: photoId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }

    // Reset stavu na PENDING aby processPhoto (idempotentný) nepreskočil.
    await prisma.photo.update({
      where: { id: photoId },
      data: { ocr_status: "PENDING", ocr_raw_text: null },
    });

    await processPhoto(photoId);

    const after = await prisma.photo.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        item_id: true,
        storage_key: true,
        ocr_raw_text: true,
        ocr_status: true,
        created_at: true,
      },
    });
    if (!after) {
      // Veľmi nepravdepodobné (foto bola zmazaná medzi update a select),
      // ale handlujme to čisto.
      res.status(404).json({ error: "Photo not found" });
      return;
    }

    const signed_url = await getSignedUrlForKey(after.storage_key);
    res.json({
      id: after.id,
      item_id: after.item_id,
      signed_url,
      ocr_raw_text: after.ocr_raw_text,
      ocr_status: after.ocr_status,
      created_at: after.created_at,
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/ocr/failed ──────────────────────────────────────────────────────
//
// Zoznam FAILED fotiek pre OCRAdminPage sekciu "Zlyhané fotky".
// Max 100 — viac sa cez UI aj tak nebude listovať, pre väčšie množstvá by
// sme robili stránkovanie (vtedy nás failed >100 čaká aj tak iná akcia).

ocrRouter.get("/failed", async (_req, res, next) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { ocr_status: "FAILED", deleted_at: null },
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        item_id: true,
        storage_key: true,
        created_at: true,
        item: { select: { name: true } },
      },
    });

    const enriched = await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        item_id: p.item_id,
        item_name: p.item.name,
        signed_url: await getSignedUrlForKey(p.storage_key),
        created_at: p.created_at,
      })),
    );

    res.json(enriched);
  } catch (e) {
    next(e);
  }
});
