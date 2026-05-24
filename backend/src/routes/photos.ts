import { Router, type Request, type Response, type NextFunction } from "express";
import multer, { MulterError } from "multer";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";
import { uploadToR2, getSignedUrlForKey } from "../services/r2.js";
import { processPhoto } from "../services/ocr.js";
import {
  getOcrEngine,
  processOverviewForName,
} from "../services/visionProcessing.js";
import { detectQrFromImage } from "../services/qrDetection.js";
import { tryAssignDetectedQr } from "../services/qrAssignment.js";

function runOverviewOcr(photoId: string): void {
  const engine = getOcrEngine();
  const run =
    engine === "gemini" ? processOverviewForName(photoId) : processPhoto(photoId);
  run.catch((err) => {
    console.error(`[photos] OVERVIEW OCR for ${photoId} failed:`, err);
  });
}

export const photosRouter: Router = Router();

// ─── multer config ────────────────────────────────────────────────────────────
//
// memoryStorage = súbor ostane v RAM ako Buffer (file.buffer), nikdy sa nezapíše
// na disk Railway containera (ten je efemérny — viď PROJECT.md §2 rozh. č. 6).
// Limit 10 MB pokrývame aj na FE kompresiou, ale BE musí mať hardstop.

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      // multer prejde túto chybu cez `next(err)` až do photoUploadErrorHandler nižšie.
      cb(new Error("INVALID_FILE_TYPE"));
    }
  },
});

// Lokálny error handler iba pre upload route — beží PRED globálnym v index.ts,
// aby sme multer-špecifické chyby preložili na ľudské 4xx odpovede skôr než
// spadnú do generického "Internal server error".
function photoUploadErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large (max 10 MB)" });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
    res.status(400).json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP" });
    return;
  }
  next(err);
}

// Rate limiter len pre upload route — 20 uploadov / min / IP.
// `validate: { trustProxy: false }` potlačí varovanie keď beží lokálne bez proxy;
// v Railway produkcii by sme nastavili app.set('trust proxy', 1) v index.ts, ale
// pre MVP rate limit per-container je dostačujúci aj bez forwarded IP.
const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, try again in a minute" },
  validate: { trustProxy: false },
});

// ─── POST /api/items/:id/photos ───────────────────────────────────────────────

// photoType vstupuje cez query string ALEBO cez body form field "photo_type"
// (akceptujeme oba — frontend posiela query, curl/tests môžu posielať body).
// Default LABEL zachová pôvodné správanie pre starší klient bez tohto poľa.
function parsePhotoType(req: Request): "LABEL" | "OVERVIEW" | null {
  const raw =
    (typeof req.query.photo_type === "string" && req.query.photo_type) ||
    (typeof req.query.photoType === "string" && req.query.photoType) ||
    (req.body && typeof req.body.photo_type === "string" && req.body.photo_type) ||
    (req.body && typeof req.body.photoType === "string" && req.body.photoType) ||
    "LABEL";
  const upper = String(raw).toUpperCase();
  if (upper === "LABEL" || upper === "OVERVIEW") return upper;
  return null;
}

photosRouter.post(
  "/items/:id/photos",
  uploadRateLimit,
  upload.single("photo"),
  photoUploadErrorHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Missing file (form field 'photo')" });
        return;
      }
      const itemId = String(req.params.id);

      const photoType = parsePhotoType(req);
      if (!photoType) {
        res.status(400).json({ error: "Invalid photo_type (must be LABEL or OVERVIEW)" });
        return;
      }

      const item = await prisma.item.findFirst({
        where: { id: itemId, deleted_at: null },
        select: { id: true, level: true },
      });
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      const photoId = randomUUID();
      const ext = EXT_BY_MIME[req.file.mimetype];
      if (!ext) {
        // Fallback — fileFilter by toto malo zachytiť skôr, ale defensively.
        res.status(400).json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP" });
        return;
      }
      const year = new Date().getUTCFullYear();
      const storageKey = `photos/${year}/${itemId}/${photoId}.${ext}`;

      // Najprv R2, potom DB. Ak DB padne po úspešnom R2 upload, ostane orphan
      // v buckete — riešime hromadným cleanup skriptom v budúcnosti (Sprint 3+).
      await uploadToR2(storageKey, req.file.buffer, req.file.mimetype);

      // OVERVIEW: default DONE (bez OCR). Výnimka L2/L3 — OCR pre návrh názvu
      // (Sprint 8). processPending stále filtruje len LABEL.
      const overviewOcrForName =
        photoType === "OVERVIEW" && [2, 3].includes(item.level);
      const ocrStatus = overviewOcrForName ? "PENDING" : photoType === "OVERVIEW" ? "DONE" : "PENDING";

      const photo = await prisma.photo.create({
        data: {
          id: photoId,
          item_id: itemId,
          storage_key: storageKey,
          ocr_status: ocrStatus,
          photo_type: photoType,
        },
        select: {
          id: true,
          ocr_status: true,
          photo_type: true,
          created_at: true,
        },
      });

      const signedUrl = await getSignedUrlForKey(storageKey);

      if (overviewOcrForName) {
        runOverviewOcr(photo.id);
      }

      // For LABEL photos: synchronously detect and assign a QR code from the
      // image before responding. The 2 s timeout in detectQrFromImage ensures
      // this never blocks the upload beyond the acceptable threshold. Both
      // functions are error-safe and always resolve (never throw).
      let qrDetection: Awaited<ReturnType<typeof tryAssignDetectedQr>> = {
        status: "NO_QR_DETECTED",
      };
      if (photoType === "LABEL") {
        const detectedQr = await detectQrFromImage(req.file.buffer);
        qrDetection = await tryAssignDetectedQr(itemId, detectedQr, prisma);
      }

      res.status(201).json({
        id: photo.id,
        signed_url: signedUrl,
        ocr_status: photo.ocr_status,
        photo_type: photo.photo_type,
        created_at: photo.created_at,
        qrDetection,
      });
    } catch (e) {
      next(e);
    }
  },
);

// ─── GET /api/items/:id/photos ────────────────────────────────────────────────

photosRouter.get("/items/:id/photos", async (req, res, next) => {
  try {
    const itemId = String(req.params.id);

    const item = await prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
      select: { id: true },
    });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const photos = await prisma.photo.findMany({
      where: { item_id: itemId, deleted_at: null },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        storage_key: true,
        ocr_raw_text: true,
        ocr_status: true,
        photo_type: true,
        created_at: true,
      },
    });

    // Signed URL sa generuje on-demand pre každú response. Parallel je rýchlejšie
    // než serial pri väčšom počte fotiek (každý presign = 1 HMAC krypto operácia,
    // bez sieťového volania).
    //
    // photo_type sa vracia pre OBA typy — frontend (PhotoGallery) si ich rozdelí
    // do sekcií "Štítky" a "Fotky položky".
    const enriched = await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        signed_url: await getSignedUrlForKey(p.storage_key),
        ocr_raw_text: p.ocr_raw_text,
        ocr_status: p.ocr_status,
        photo_type: p.photo_type,
        created_at: p.created_at,
      })),
    );

    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/photos/:id ──────────────────────────────────────────────────────

photosRouter.get("/photos/:id", async (req, res, next) => {
  try {
    const photo = await prisma.photo.findFirst({
      where: { id: req.params.id, deleted_at: null },
      select: {
        id: true,
        item_id: true,
        storage_key: true,
        ocr_raw_text: true,
        ocr_status: true,
        photo_type: true,
        created_at: true,
      },
    });
    if (!photo) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }
    const signed_url = await getSignedUrlForKey(photo.storage_key);
    res.json({
      id: photo.id,
      item_id: photo.item_id,
      signed_url,
      ocr_raw_text: photo.ocr_raw_text,
      ocr_status: photo.ocr_status,
      photo_type: photo.photo_type,
      created_at: photo.created_at,
    });
  } catch (e) {
    next(e);
  }
});

// ─── DELETE /api/photos/:id ───────────────────────────────────────────────────
//
// Soft delete — R2 objekt zámerne nemažeme. Orphan cleanup (zmazať z R2 všetky
// kľúče čo nemajú aktívny Photo riadok) ostáva ako TD pre budúci sprint.

photosRouter.delete("/photos/:id", async (req, res, next) => {
  try {
    const existing = await prisma.photo.findFirst({
      where: { id: req.params.id, deleted_at: null },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }
    await prisma.photo.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date() },
    });
    res.json({ id: req.params.id, deleted: true });
  } catch (e) {
    next(e);
  }
});
