import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { PARENT_TYPE_BY_CHILD } from "../constants.js";

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
            name: body.name ?? null,
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
        name: body.name ?? null,
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
      select: { id: true, parent_id: true },
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
