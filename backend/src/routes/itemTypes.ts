import { Router } from "express";
import { prisma } from "../prisma.js";

export const itemTypesRouter: Router = Router();

itemTypesRouter.get("/item-types", async (_req, res, next) => {
  try {
    const types = await prisma.itemType.findMany({ orderBy: { code: "asc" } });
    res.json(types);
  } catch (e) {
    next(e);
  }
});
