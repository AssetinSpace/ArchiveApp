import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { PARENT_TYPE_BY_CHILD } from "../constants.js";
import { getItemPath, type PathNode } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "../services/r2.js";
import { generateAutoName } from "../services/autoName.js";

export const itemsRouter: Router = Router();

// Overí že parent_id zodpovedá očakávanému typu rodiča pre daný type_code.
// Vracia chybovú správu alebo null ak je validácia OK.
async function validateParentType(
  typeCode: string,
  parentId: string | null | undefined,
): Promise<string | null> {
  const expectedParentType = PARENT_TYPE_BY_CHILD[typeCode];
  // Neznámy typ — necháme padnúť na ItemType lookup vyššie.
  if (expectedParentType === undefined) return null;

  if (expectedParentType === null) {
    if (parentId) {
      return `${typeCode} is a root type and must not have a parent`;
    }
    return null;
  }

  if (!parentId) {
    return `${typeCode} must have parent of type ${expectedParentType}`;
  }
  const parent = await prisma.item.findFirst({
    where: { id: parentId, deleted_at: null },
    select: { type_code: true },
  });
  if (!parent) return "Parent does not exist or is deleted";
  if (parent.type_code !== expectedParentType) {
    return `${typeCode} must have parent of type ${expectedParentType}, got ${parent.type_code}`;
  }
  return null;
}

// Overí že medzi aktívnymi položkami rovnakého typu a rodiča neexistuje
// položka s rovnakým názvom (porovnanie case-insensitive).
// excludeId sa použije pri PATCH aby sme nevylúčili samu seba.
async function checkNameConflict(
  typeCode: string,
  parentId: string | null | undefined,
  name: string,
  excludeId?: string,
): Promise<string | null> {
  const conflict = await prisma.item.findFirst({
    where: {
      type_code: typeCode,
      parent_id: parentId ?? null,
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    return `Položka s názvom "${name}" tohto typu už existuje na rovnakom mieste`;
  }
  return null;
}

const StatusSchema = z.enum(["NA_MIESTE", "VYNESENE", "NEZNAME"]);

const CreateItemSchema = z.object({
  type_code: z.string().min(1),
  name: z.string().min(1).max(500).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  note: z.string().max(10000).optional().nullable(),
  qr_code: z.string().min(1).max(100).optional().nullable(),
});

const UpdateItemSchema = z
  .object({
    name: z.string().min(1).max(500).nullable().optional(),
    note: z.string().max(10000).nullable().optional(),
    status: StatusSchema.optional(),
    parent_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });

const ListQuerySchema = z.object({
  type_code: z.string().optional(),
  parent_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

// Helper: detekcia cyklu pri zmene parent_id.
// Prejde reťazou predkov od newParentId smerom hore (cez parent_id) a vráti true ak narazí na itemId.
async function wouldCreateCycle(itemId: string, newParentId: string): Promise<boolean> {
  if (itemId === newParentId) return true;
  let cursor: string | null = newParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === itemId) return true;
    if (seen.has(cursor)) return false; // bezpečnostná poistka
    seen.add(cursor);
    const parent: { parent_id: string | null } | null = await prisma.item.findUnique({
      where: { id: cursor },
      select: { parent_id: true },
    });
    if (!parent) return false;
    cursor = parent.parent_id;
  }
  return false;
}

itemsRouter.get("/", async (req, res, next) => {
  try {
    const q = ListQuerySchema.parse(req.query);
    const where: Record<string, unknown> = { deleted_at: null };
    if (q.type_code) where.type_code = q.type_code;
    if (q.parent_id !== undefined) {
      where.parent_id = q.parent_id === "null" || q.parent_id === "" ? null : q.parent_id;
    }
    const items = await prisma.item.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: q.limit ?? 100,
      include: { parent: true },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// GET /api/items/inventory — flat list pre tabuľku (všetky aktívne položky + počty + OCR preview).
//
// ocr_text: zreťazený raw text z max 3 najnovších DONE fotiek (na client-side hľadanie).
// Neprenášame celý korpus — take:3 dáva rozumný kompromis medzi pokrytím a veľkosťou odpovede.
itemsRouter.get("/inventory", async (_req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: { deleted_at: null },
      orderBy: [{ type_code: "asc" }, { name: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        type_code: true,
        name: true,
        parent_id: true,
        qr_code: true,
        note: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            children: { where: { deleted_at: null } },
            photos: { where: { deleted_at: null } },
          },
        },
        photos: {
          where: { deleted_at: null, ocr_status: "DONE" },
          orderBy: { created_at: "desc" },
          take: 3,
          select: { ocr_raw_text: true },
        },
      },
    });

    // Agregujeme OCR texty do jedného stringu na FE full-text vyhľadávanie.
    const result = items.map((item) => {
      const { photos, ...rest } = item;
      const ocr_text = photos
        .map((p) => p.ocr_raw_text)
        .filter((t): t is string => !!t)
        .join(" ")
        .slice(0, 2000) || null;
      return { ...rest, ocr_text };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

itemsRouter.post("/", async (req, res, next) => {
  try {
    const body = CreateItemSchema.parse(req.body);

    const type = await prisma.itemType.findUnique({ where: { code: body.type_code } });
    if (!type) {
      res.status(400).json({ error: `Unknown type_code: ${body.type_code}` });
      return;
    }

    const parentErr = await validateParentType(body.type_code, body.parent_id);
    if (parentErr) {
      res.status(400).json({ error: parentErr });
      return;
    }

    if (body.name) {
      const nameErr = await checkNameConflict(body.type_code, body.parent_id, body.name);
      if (nameErr) {
        res.status(409).json({ error: nameErr });
        return;
      }
    }

    // Sprint 5: vygenerujeme auto_name (pozičný identifikátor sklA_pal003_...).
    // Vracia null pre koreňový SKLAD alebo neznáme typy. Ak user pošle name
    // ručne, použije sa user name; inak fallback name = autoName (terénny flow).
    const autoName = await generateAutoName(body.parent_id ?? null, body.type_code);
    const finalName = body.name ?? autoName;

    // Ak je qr_code zadané: musí to byť existujúci FREE QRTag.
    // Vytvorenie itemu + assign QRTag prebehne atomicky v transakcii aby
    // sa zachovala konzistencia Item.qr_code ↔ QRTag.assigned_item_id.
    if (body.qr_code) {
      const created = await prisma.$transaction(async (tx) => {
        const tag = await tx.qRTag.findUnique({ where: { code: body.qr_code! } });
        if (!tag) return { error: { status: 400, message: "QR code not found" } };
        if (tag.status !== "FREE") {
          return { error: { status: 400, message: "QR code already assigned" } };
        }
        const item = await tx.item.create({
          data: {
            type_code: body.type_code,
            name: finalName,
            auto_name: autoName,
            parent_id: body.parent_id ?? null,
            note: body.note ?? null,
            qr_code: body.qr_code,
          },
          include: { parent: true },
        });
        await tx.qRTag.update({
          where: { code: body.qr_code! },
          data: { status: "ASSIGNED", assigned_item_id: item.id },
        });
        return { item };
      });

      if ("error" in created && created.error) {
        res.status(created.error.status).json({ error: created.error.message });
        return;
      }
      res.status(201).json(created.item);
      return;
    }

    const created = await prisma.item.create({
      data: {
        type_code: body.type_code,
        name: finalName,
        auto_name: autoName,
        parent_id: body.parent_id ?? null,
        note: body.note ?? null,
        qr_code: null,
      },
      include: { parent: true },
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// GET /api/items/by-qr/:qrCode/contents — Sprint 4 (box contents).
// Najde KRABICA-u podľa QR kódu a vráti všetky aktívne ZLOZKA descendants
// (rekurzívne, cez WITH RECURSIVE) s thumbnailmi a photoCount-om.
// 400 ak QR nie je priradený KRABICA-e, 404 ak neexistuje.
itemsRouter.get("/by-qr/:qrCode/contents", async (req, res, next) => {
  try {
    const qrCode = req.params.qrCode;
    const box = await prisma.item.findFirst({
      where: { qr_code: qrCode, deleted_at: null },
      select: { id: true, name: true, qr_code: true, type_code: true },
    });
    if (!box) {
      res.status(404).json({ error: "Item with this QR code not found" });
      return;
    }
    if (box.type_code !== "KRABICA") {
      res.status(400).json({
        error: `QR ${qrCode} is assigned to ${box.type_code}, not KRABICA`,
      });
      return;
    }

    // Recursive CTE: zber všetkých descendants, filter na ZLOZKA na konci.
    // D-5: filter na výstupe (nie vo WHERE rekurzie) aby sme v budúcnosti
    // vedeli vrátiť aj DOKUMENT pod ZLOZKA-mi keď príde fáza 2.
    type FolderRow = {
      id: string;
      parent_id: string | null;
      type_code: string;
      name: string | null;
      qr_code: string | null;
      status: string;
      note: string | null;
    };
    const folders = await prisma.$queryRaw<FolderRow[]>`
      WITH RECURSIVE descendants AS (
        SELECT id, parent_id, type_code, name, qr_code, status::text AS status, note
        FROM "Item"
        WHERE parent_id = ${box.id} AND deleted_at IS NULL
        UNION ALL
        SELECT c.id, c.parent_id, c.type_code, c.name, c.qr_code, c.status::text AS status, c.note
        FROM "Item" c
        JOIN descendants d ON c.parent_id = d.id
        WHERE c.deleted_at IS NULL
      )
      SELECT id, parent_id, type_code, name, qr_code, status, note
      FROM descendants
      WHERE type_code = 'ZLOZKA'
      ORDER BY name NULLS LAST, id;
    `;

    const folderIds = folders.map((f) => f.id);

    // Latest photo per folder.
    type ThumbRow = { item_id: string; storage_key: string };
    const thumbs: ThumbRow[] = folderIds.length
      ? await prisma.$queryRaw<ThumbRow[]>`
          SELECT DISTINCT ON (item_id) item_id, storage_key
          FROM "Photo"
          WHERE item_id = ANY(${folderIds}::text[]) AND deleted_at IS NULL
          ORDER BY item_id, created_at DESC;
        `
      : [];
    const thumbByItem = new Map(thumbs.map((t) => [t.item_id, t.storage_key]));

    // Photo count per folder.
    type CountRow = { item_id: string; count: bigint };
    const counts: CountRow[] = folderIds.length
      ? await prisma.$queryRaw<CountRow[]>`
          SELECT item_id, COUNT(*) AS count
          FROM "Photo"
          WHERE item_id = ANY(${folderIds}::text[]) AND deleted_at IS NULL
          GROUP BY item_id;
        `
      : [];
    const countByItem = new Map(counts.map((c) => [c.item_id, Number(c.count)]));

    // Sign URLs paralelne.
    const signed = await Promise.all(
      folders.map(async (f) => {
        const key = thumbByItem.get(f.id);
        if (!key) return null;
        const url = await getSignedUrlForKey(key, 900);
        return { storageKey: key, signedUrl: url };
      }),
    );

    const path: PathNode[] = await getItemPath(box.id);

    res.json({
      box: {
        id: box.id,
        name: box.name,
        qrCode: box.qr_code,
        path,
      },
      folders: folders.map((f, idx) => ({
        id: f.id,
        name: f.name,
        qrCode: f.qr_code,
        status: f.status,
        note: f.note,
        photo: signed[idx],
        photoCount: countByItem.get(f.id) ?? 0,
      })),
    });
  } catch (e) {
    next(e);
  }
});

itemsRouter.get("/:id", async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({
      where: { id: req.params.id, deleted_at: null },
      include: {
        parent: true,
        _count: { select: { children: { where: { deleted_at: null } } } },
      },
    });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  } catch (e) {
    next(e);
  }
});

itemsRouter.get("/:id/children", async (req, res, next) => {
  try {
    const parent = await prisma.item.findFirst({
      where: { id: req.params.id, deleted_at: null },
      select: { id: true },
    });
    if (!parent) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const children = await prisma.item.findMany({
      where: { parent_id: req.params.id, deleted_at: null },
      orderBy: { created_at: "asc" },
    });
    res.json(children);
  } catch (e) {
    next(e);
  }
});

itemsRouter.get("/:id/path", async (req, res, next) => {
  try {
    const id = req.params.id;
    const start = await prisma.item.findFirst({
      where: { id, deleted_at: null },
      include: { parent: true },
    });
    if (!start) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const path: typeof start[] = [start];
    let cursor: string | null = start.parent_id;
    const seen = new Set<string>([start.id]);
    while (cursor) {
      if (seen.has(cursor)) break; // ochrana proti hypotetickému cyklu
      seen.add(cursor);
      const node = await prisma.item.findFirst({
        where: { id: cursor, deleted_at: null },
        include: { parent: true },
      });
      if (!node) break;
      path.push(node);
      cursor = node.parent_id;
    }
    path.reverse();
    res.json(path);
  } catch (e) {
    next(e);
  }
});

itemsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = UpdateItemSchema.parse(req.body);

    const existing = await prisma.item.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, type_code: true, parent_id: true, name: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (body.parent_id !== undefined && body.parent_id !== existing.parent_id) {
      if (body.parent_id !== null) {
        if (body.parent_id === id) {
          res.status(400).json({ error: "Item cannot be its own parent" });
          return;
        }
        const parent = await prisma.item.findFirst({
          where: { id: body.parent_id, deleted_at: null },
          select: { id: true },
        });
        if (!parent) {
          res.status(400).json({ error: "Parent does not exist or is deleted" });
          return;
        }
        if (await wouldCreateCycle(id, body.parent_id)) {
          res.status(400).json({ error: "Cannot create cycle" });
          return;
        }
      }
    }

    // Ak sa mení názov alebo rodič, skontrolujeme únikanosť názvu.
    const finalName = body.name !== undefined ? body.name : existing.name;
    const finalParentId = body.parent_id !== undefined ? body.parent_id : existing.parent_id;
    if (finalName) {
      const nameErr = await checkNameConflict(existing.type_code, finalParentId, finalName, id);
      if (nameErr) {
        res.status(409).json({ error: nameErr });
        return;
      }
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.parent_id !== undefined ? { parent_id: body.parent_id } : {}),
      },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

itemsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await prisma.item.findFirst({
      where: { id, deleted_at: null },
      include: { _count: { select: { children: { where: { deleted_at: null } } } } },
    });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (item._count.children > 0) {
      res.status(400).json({ error: "Cannot delete item with children" });
      return;
    }
    await prisma.item.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
