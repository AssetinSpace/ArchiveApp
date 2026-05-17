// Search route — Sprint 4.
// GET /api/search?q=...&limit=50
//
// Validácia:
// - q: trim, min 2, max 200 znakov (chránime DB pred prázdnym query / DoS-om)
// - limit: 1–200 (default 50). Žiaden paging zatiaľ — jednoduchosť.
// Auth: chránené basicAuth middlewarom v index.ts.

import { Router } from "express";
import { z } from "zod";
import { searchItems } from "../services/search.js";

export const searchRouter: Router = Router();

const SearchQuerySchema = z.object({
  q: z.string().trim().min(2, "q must be at least 2 characters").max(200),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

searchRouter.get("/", async (req, res, next) => {
  try {
    const { q, limit } = SearchQuerySchema.parse(req.query);
    const hits = await searchItems(q, limit);
    res.json({ query: q, count: hits.length, hits });
  } catch (e) {
    next(e);
  }
});
