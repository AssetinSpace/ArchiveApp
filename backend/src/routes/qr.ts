import { Router } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { prisma } from "../prisma.js";
import { getItemPath } from "../lib/itemPath.js";

export const qrRouter: Router = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

const PREFIX_PATTERN = /^[A-Za-z0-9_]{1,16}$/;

function mm(n: number): number {
  // 1mm = 2.83465pt v PDF
  return n * 2.83465;
}

// Vyparsuje sekvenčné číslo z konca kódu (napr. "QR-000042" → 42).
// Vráti null ak kód nesedí s formátom.
function parseSeq(code: string, prefix: string): number | null {
  const expected = `${prefix}-`;
  if (!code.startsWith(expected)) return null;
  const rest = code.slice(expected.length);
  if (!/^\d{6}$/.test(rest)) return null;
  return Number.parseInt(rest, 10);
}

function formatCode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

// ─── POST /api/qr/generate ────────────────────────────────────────────────────

const GenerateSchema = z.object({
  count: z.number().int().min(1).max(500),
  prefix: z.string().regex(PREFIX_PATTERN).optional(),
});

qrRouter.post("/generate", async (req, res, next) => {
  try {
    const body = GenerateSchema.parse(req.body);
    const prefix = body.prefix ?? "QR";

    // Nájdi najvyššie existujúce sekvenčné číslo s daným prefixom.
    // Pretože kódy sú zero-padded na 6 číslic, lexikografické zoradenie = numerické.
    const last = await prisma.qRTag.findFirst({
      where: { code: { startsWith: `${prefix}-` } },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const startSeq = (last ? (parseSeq(last.code, prefix) ?? 0) : 0) + 1;

    const data = Array.from({ length: body.count }, (_, i) => ({
      code: formatCode(prefix, startSeq + i),
    }));

    // createMany s skipDuplicates pre prípad race condition pri paralelnej generácii.
    await prisma.qRTag.createMany({ data, skipDuplicates: true });

    const created = await prisma.qRTag.findMany({
      where: { code: { in: data.map((d) => d.code) } },
      orderBy: { code: "asc" },
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/qr/import ──────────────────────────────────────────────────────

const ImportSchema = z.object({
  codes: z.array(z.string().min(1).max(64)).min(1).max(1000),
});

qrRouter.post("/import", async (req, res, next) => {
  try {
    const body = ImportSchema.parse(req.body);
    // Deduplicate input a trim whitespace.
    const unique = Array.from(new Set(body.codes.map((c) => c.trim()).filter(Boolean)));

    const existing = await prisma.qRTag.findMany({
      where: { code: { in: unique } },
      select: { code: true },
    });
    const existingSet = new Set(existing.map((e) => e.code));
    const toCreate = unique.filter((c) => !existingSet.has(c));

    if (toCreate.length > 0) {
      await prisma.qRTag.createMany({
        data: toCreate.map((code) => ({ code })),
        skipDuplicates: true,
      });
    }
    res.status(201).json({
      created: toCreate.length,
      skipped: unique.length - toCreate.length,
      codes: toCreate,
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/qr/print ────────────────────────────────────────────────────────
// Definované pred /:code aby Express neinterpretoval "print" ako :code parameter.

qrRouter.get("/print", async (req, res, next) => {
  try {
    const raw = String(req.query.codes ?? "");
    const codes = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (codes.length === 0) {
      res.status(400).json({ error: "Query param 'codes' is required (comma-separated)" });
      return;
    }
    if (codes.length > 500) {
      res.status(400).json({ error: "Maximum 500 codes per PDF" });
      return;
    }

    // Vygeneruj všetky QR obrázky vopred (paralelne) ako PNG buffery.
    const pngBuffers = await Promise.all(
      codes.map((code) =>
        QRCode.toBuffer(code, {
          type: "png",
          errorCorrectionLevel: "M",
          margin: 1,
          width: 300,
        }),
      ),
    );

    // A4 = 210 × 297 mm, grid 4×8 = 32 štítkov/strana
    const pageW = mm(210);
    const pageH = mm(297);
    const cols = 4;
    const rows = 8;
    const cellW = pageW / cols; // ~52.5mm
    const cellH = pageH / rows; // ~37.1mm
    const pad = mm(2); // okraj okolo štítku pre prípad strihania
    const qrSize = mm(30); // čitateľnosť telefónom z 15-20cm
    const fontSize = 9;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="qr-labels.pdf"');

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    codes.forEach((code, idx) => {
      const localIdx = idx % (cols * rows);
      if (idx > 0 && localIdx === 0) doc.addPage();

      const col = localIdx % cols;
      const row = Math.floor(localIdx / cols);
      const cellX = col * cellW;
      const cellY = row * cellH;

      // Vnútorná oblasť štítku (po padding-u).
      const innerX = cellX + pad;
      const innerY = cellY + pad;
      const innerW = cellW - 2 * pad;
      const innerH = cellH - 2 * pad;

      // QR centrovaný horizontálne, ukotvený k vrchu vnútornej oblasti.
      const qrX = innerX + (innerW - qrSize) / 2;
      const qrY = innerY;
      doc.image(pngBuffers[idx], qrX, qrY, { width: qrSize, height: qrSize });

      // Text kódu pod QR, centrovaný.
      const textY = qrY + qrSize + mm(1);
      doc
        .font("Helvetica")
        .fontSize(fontSize)
        .fillColor("#000")
        .text(code, innerX, textY, {
          width: innerW,
          align: "center",
        });

      // Čiarkovaný okraj pre rezanie.
      doc
        .rect(cellX, cellY, cellW, cellH)
        .dash(3, { space: 3 })
        .stroke("#CCCCCC")
        .undash();
    });

    doc.end();
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/qr/bulk-delete ───────────────────────────────────────────────────

const BulkDeleteSchema = z.object({
  codes: z.array(z.string().min(1).max(64)).min(1).max(500),
});

async function deleteQrTagsByCodes(codes: string[]): Promise<{
  deleted: number;
  not_found: number;
  requested: number;
}> {
  const unique = Array.from(new Set(codes.map((c) => c.trim()).filter(Boolean)));

  return prisma.$transaction(async (tx) => {
    const tags = await tx.qRTag.findMany({
      where: { code: { in: unique } },
      select: { code: true, status: true, assigned_item_id: true },
    });
    const tagByCode = new Map(tags.map((t) => [t.code, t]));

    let deleted = 0;
    let not_found = 0;

    for (const code of unique) {
      const tag = tagByCode.get(code);
      if (!tag) {
        not_found += 1;
        continue;
      }

      if (tag.status === "ASSIGNED" && tag.assigned_item_id) {
        await tx.item.updateMany({
          where: { id: tag.assigned_item_id, qr_code: code },
          data: { qr_code: null },
        });
      }

      await tx.qRTag.delete({ where: { code } });
      deleted += 1;
    }

    return { deleted, not_found, requested: unique.length };
  });
}

qrRouter.post("/bulk-delete", async (req, res, next) => {
  try {
    const body = BulkDeleteSchema.parse(req.body);
    const result = await deleteQrTagsByCodes(body.codes);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/qr ──────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  status: z.enum(["FREE", "ASSIGNED"]).optional(),
});

qrRouter.get("/", async (req, res, next) => {
  try {
    const q = ListQuerySchema.parse(req.query);
    const tags = await prisma.qRTag.findMany({
      where: q.status ? { status: q.status } : {},
      orderBy: { code: "asc" },
      include: {
        assigned_item: {
          select: { id: true, name: true, type_code: true },
        },
      },
    });
    res.json(tags);
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/qr/:code ────────────────────────────────────────────────────────

qrRouter.get("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const tag = await prisma.qRTag.findUnique({
      where: { code },
      include: {
        assigned_item: {
          select: { id: true, name: true, type_code: true },
        },
      },
    });
    if (!tag) {
      res.status(404).json({ error: "QR code not found" });
      return;
    }

    let assignedItem: {
      id: string;
      name: string | null;
      type_code: string;
      path: Awaited<ReturnType<typeof getItemPath>>;
    } | null = null;

    if (tag.status === "ASSIGNED" && tag.assigned_item) {
      const path = await getItemPath(tag.assigned_item.id);
      assignedItem = {
        id: tag.assigned_item.id,
        name: tag.assigned_item.name,
        type_code: tag.assigned_item.type_code,
        path,
      };
    }

    res.json({
      id: tag.id,
      code: tag.code,
      status: tag.status,
      assignedItem,
    });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/qr/:code/assign ────────────────────────────────────────────────

const AssignSchema = z.object({
  item_id: z.string().uuid(),
});

qrRouter.post("/:code/assign", async (req, res, next) => {
  try {
    const code = req.params.code;
    const body = AssignSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const tag = await tx.qRTag.findUnique({ where: { code } });
      if (!tag) return { error: { status: 404, message: "QR code not found" } };
      if (tag.status !== "FREE") {
        return { error: { status: 400, message: "QR code already assigned" } };
      }

      const item = await tx.item.findFirst({
        where: { id: body.item_id, deleted_at: null },
      });
      if (!item) return { error: { status: 400, message: "Item not found" } };
      if (item.qr_code && item.qr_code !== code) {
        return {
          error: { status: 400, message: "Item already has a different QR code assigned" },
        };
      }

      // Atomicky: nastav QRTag.assigned + Item.qr_code (denormalizovaná dvojica
      // musí zostať konzistentná, viď architektonické rozhodnutie v pláne).
      const updatedTag = await tx.qRTag.update({
        where: { code },
        data: { status: "ASSIGNED", assigned_item_id: item.id },
        include: {
          assigned_item: { select: { id: true, name: true, type_code: true } },
        },
      });
      await tx.item.update({
        where: { id: item.id },
        data: { qr_code: code },
      });
      return { tag: updatedTag };
    });

    if ("error" in result && result.error) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json(result.tag);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/qr/:code/unassign ──────────────────────────────────────────────

qrRouter.post("/:code/unassign", async (req, res, next) => {
  try {
    const code = req.params.code;

    const result = await prisma.$transaction(async (tx) => {
      const tag = await tx.qRTag.findUnique({ where: { code } });
      if (!tag) return { error: { status: 404, message: "QR code not found" } };
      if (tag.status === "FREE") {
        return { tag, noop: true as const };
      }

      const updatedTag = await tx.qRTag.update({
        where: { code },
        data: { status: "FREE", assigned_item_id: null },
      });
      if (tag.assigned_item_id) {
        // Zrkadlové vyčistenie Item.qr_code.
        await tx.item.updateMany({
          where: { id: tag.assigned_item_id, qr_code: code },
          data: { qr_code: null },
        });
      }
      return { tag: updatedTag };
    });

    if ("error" in result && result.error) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json(result.tag);
  } catch (e) {
    next(e);
  }
});

// ─── DELETE /api/qr/:code ─────────────────────────────────────────────────────

qrRouter.delete("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const result = await deleteQrTagsByCodes([code]);
    if (result.deleted === 0) {
      res.status(404).json({ error: "QR code not found" });
      return;
    }
    res.json({ deleted: true, code });
  } catch (e) {
    next(e);
  }
});
