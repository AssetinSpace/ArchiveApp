import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { getItemPath, type PathNode } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "../services/r2.js";
import { generateName } from "../services/nameGeneration.js";

export const itemsRouter: Router = Router();

async function validateLevelParent(
  level: number,
  parentId: string | null | undefined,
): Promise<string | null> {
  if (!parentId) {
    if (level !== 1) {
      return "Koreňová položka musí mať level 1";
    }
    return null;
  }

  const parent = await prisma.item.findUnique({
    where: { id: parentId },
    select: { level: true, deleted_at: true },
  });
  if (!parent || parent.deleted_at) {
    return "Parent neexistuje";
  }
  if (parent.level >= level) {
    return `Child level (${level}) musí byť väčší ako parent level (${parent.level})`;
  }
  if (level > parent.level + 1) {
    return `Child level (${level}) musí byť najviac parent level + 1 (${parent.level + 1})`;
  }
  if (parent.level === 7) {
    return "L7 nemôže mať deti";
  }
  return null;
}

async function checkNameConflict(
  kind: string,
  parentId: string | null | undefined,
  name: string,
  excludeId?: string,
): Promise<string | null> {
  const conflict = await prisma.item.findFirst({
    where: {
      kind,
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
  level: z.number().int().min(1).max(7),
  kind: z.string().min(1).max(100),
  name: z.string().min(1).max(500).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  note: z.string().max(10000).optional().nullable(),
  qr_code: z.string().min(1).max(100).optional().nullable(),
  status: StatusSchema.optional(),
});

const UpdateItemSchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    note: z.string().max(10000).nullable().optional(),
    status: StatusSchema.optional(),
    parent_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });

const ListQuerySchema = z.object({
  type_code: z.string().optional(),
  kind: z.string().optional(),
  level: z.coerce.number().int().min(1).max(7).optional(),
  parent_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

async function wouldCreateCycle(itemId: string, newParentId: string): Promise<boolean> {
  if (itemId === newParentId) return true;
  let cursor: string | null = newParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === itemId) return true;
    if (seen.has(cursor)) return false;
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
    if (q.kind) where.kind = q.kind;
    if (q.level !== undefined) where.level = q.level;
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

itemsRouter.get("/inventory", async (_req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: { deleted_at: null },
      orderBy: [{ level: "asc" }, { kind: "asc" }, { name: "asc" }],
      select: {
        id: true,
        level: true,
        kind: true,
        name: true,
        name_source: true,
        ocr_name_suggestion: true,
        type_code: true,
        parent_id: true,
        qr_code: true,
        note: true,
        status: true,
        auto_name: true,
        metadata: true,
        metadata_status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            children: { where: { deleted_at: null } },
            photos: { where: { deleted_at: null } },
          },
        },
        photos: {
          where: {
            deleted_at: null,
            photo_type: "LABEL",
            ocr_status: "DONE",
          },
          orderBy: { created_at: "desc" },
          take: 3,
          select: { ocr_raw_text: true },
        },
      },
    });

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

const NamePreviewQuerySchema = z.object({
  kind: z.string().min(1),
  parent_id: z.string().uuid().optional().nullable(),
});

itemsRouter.get("/name-preview", async (req, res, next) => {
  try {
    const q = NamePreviewQuerySchema.parse(req.query);
    const parentId = q.parent_id ?? null;
    if (parentId) {
      const parent = await prisma.item.findFirst({
        where: { id: parentId, deleted_at: null },
        select: { level: true },
      });
      if (!parent) {
        res.status(400).json({ error: "Parent neexistuje" });
        return;
      }
      const err = await validateLevelParent(parent.level + 1, parentId);
      if (err) {
        res.status(400).json({ error: err });
        return;
      }
    }
    const name = await generateName(parentId, q.kind);
    res.json({ name });
  } catch (e) {
    next(e);
  }
});

itemsRouter.post("/", async (req, res, next) => {
  try {
    const body = CreateItemSchema.parse(req.body);
    const { level, kind, parent_id } = body;

    const parentErr = await validateLevelParent(level, parent_id);
    if (parentErr) {
      res.status(400).json({ error: parentErr });
      return;
    }

    const trimmedName = body.name?.trim();
    const generatedName = await generateName(parent_id ?? null, kind);
    const name = trimmedName || generatedName;
    const name_source = trimmedName ? "MANUAL" : "GENERATED";

    if (trimmedName) {
      const nameErr = await checkNameConflict(kind, parent_id, trimmedName);
      if (nameErr) {
        res.status(409).json({ error: nameErr });
        return;
      }
    }

    const createData = {
      level,
      kind,
      name,
      name_source,
      parent_id: parent_id ?? null,
      note: body.note ?? null,
      qr_code: body.qr_code ?? null,
      ...(body.status ? { status: body.status } : {}),
    };

    if (body.qr_code) {
      const created = await prisma.$transaction(async (tx) => {
        const tag = await tx.qRTag.findUnique({ where: { code: body.qr_code! } });
        if (!tag) return { error: { status: 400, message: "QR code not found" } };
        if (tag.status !== "FREE") {
          return { error: { status: 400, message: "QR code already assigned" } };
        }
        const item = await tx.item.create({
          data: { ...createData, qr_code: body.qr_code },
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
      data: { ...createData, qr_code: null },
      include: { parent: true },
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

itemsRouter.get("/by-qr/:qrCode/contents", async (req, res, next) => {
  try {
    const qrCode = req.params.qrCode;
    const box = await prisma.item.findFirst({
      where: { qr_code: qrCode, deleted_at: null },
      select: { id: true, name: true, qr_code: true, level: true, kind: true },
    });
    if (!box) {
      res.status(404).json({ error: "Item with this QR code not found" });
      return;
    }
    if (box.level !== 4) {
      res.status(400).json({
        error: `QR ${qrCode} is assigned to L${box.level} ${box.kind}, not a box (L4)`,
      });
      return;
    }

    type FolderRow = {
      id: string;
      parent_id: string | null;
      level: number;
      kind: string;
      name: string;
      qr_code: string | null;
      status: string;
      note: string | null;
    };
    const folders = await prisma.$queryRaw<FolderRow[]>`
      WITH RECURSIVE descendants AS (
        SELECT id, parent_id, level, kind, name, qr_code, status::text AS status, note
        FROM "Item"
        WHERE parent_id = ${box.id} AND deleted_at IS NULL
        UNION ALL
        SELECT c.id, c.parent_id, c.level, c.kind, c.name, c.qr_code, c.status::text AS status, c.note
        FROM "Item" c
        JOIN descendants d ON c.parent_id = d.id
        WHERE c.deleted_at IS NULL
      )
      SELECT id, parent_id, level, kind, name, qr_code, status, note
      FROM descendants
      WHERE level = 5 OR kind = 'ZLOZKA'
      ORDER BY name, id;
    `;

    const folderIds = folders.map((f) => f.id);

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

itemsRouter.get("/:id/descendants/count", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parent = await prisma.item.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!parent) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const rows = await prisma.$queryRaw<[{ count: bigint }]>`
      WITH RECURSIVE subtree AS (
        SELECT id FROM "Item"
        WHERE parent_id = ${id} AND deleted_at IS NULL
        UNION ALL
        SELECT i.id FROM "Item" i
        INNER JOIN subtree s ON i.parent_id = s.id
        WHERE i.deleted_at IS NULL
      )
      SELECT COUNT(*)::bigint AS count FROM subtree;
    `;
    res.json({ count: Number(rows[0]?.count ?? 0) });
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
    const path: (typeof start)[] = [start];
    let cursor: string | null = start.parent_id;
    const seen = new Set<string>([start.id]);
    while (cursor) {
      if (seen.has(cursor)) break;
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

itemsRouter.patch("/:id/name", async (req, res, next) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "name je povinný" });
      return;
    }
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, deleted_at: null },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { name: name.trim(), name_source: "MANUAL" },
    });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

itemsRouter.post("/:id/confirm-ocr-name", async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item || item.deleted_at) {
      res.status(404).json({ error: "Item nenájdený" });
      return;
    }
    if (!item.ocr_name_suggestion) {
      res.status(400).json({ error: "Žiadny OCR návrh názvu" });
      return;
    }
    const bodyName =
      req.body && typeof req.body === "object" && "name" in req.body
        ? (req.body as { name?: string }).name
        : undefined;
    const confirmed = (bodyName ?? item.ocr_name_suggestion).trim();
    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        name: confirmed,
        name_source: "OCR",
        ocr_name_suggestion: null,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

itemsRouter.post("/:id/dismiss-ocr-name", async (req, res, next) => {
  try {
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, deleted_at: null },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: { ocr_name_suggestion: null },
    });
    res.json(updated);
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
      select: { id: true, kind: true, parent_id: true, name: true },
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

    const finalName = body.name !== undefined ? body.name : existing.name;
    const finalParentId = body.parent_id !== undefined ? body.parent_id : existing.parent_id;
    if (finalName) {
      const nameErr = await checkNameConflict(existing.kind, finalParentId, finalName, id);
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
    const cascade = req.query.cascade === "true" || req.query.cascade === "1";
    const item = await prisma.item.findFirst({
      where: { id, deleted_at: null },
      include: { _count: { select: { children: { where: { deleted_at: null } } } } },
    });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (item._count.children > 0 && !cascade) {
      res.status(400).json({
        error: "Cannot delete item with children",
        hint: "Use ?cascade=true to soft-delete the item and all descendants",
      });
      return;
    }
    const now = new Date();
    if (cascade) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        WITH RECURSIVE subtree AS (
          SELECT id FROM "Item"
          WHERE id = ${id} AND deleted_at IS NULL
          UNION ALL
          SELECT i.id FROM "Item" i
          INNER JOIN subtree s ON i.parent_id = s.id
          WHERE i.deleted_at IS NULL
        )
        SELECT id FROM subtree;
      `;
      const ids = rows.map((r) => r.id);
      if (ids.length > 0) {
        await prisma.item.updateMany({
          where: { id: { in: ids } },
          data: { deleted_at: now },
        });
      }
    } else {
      await prisma.item.update({
        where: { id },
        data: { deleted_at: now },
      });
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
