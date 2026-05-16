import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { basicAuth } from "./auth.js";
import { itemTypesRouter } from "./routes/itemTypes.js";
import { itemsRouter } from "./routes/items.js";
import { qrRouter } from "./routes/qr.js";

const app = express();

// Whitelist povolených origin-ov pre CORS.
// - localhost:5173 = lokálny Vite dev server
// - archiveapp.pages.dev = Cloudflare Pages produkcia
// - FRONTEND_URL = budúca vlastná doména (nastav v Railway Variables)
// - CORS_ORIGIN = nepovinný čiarkami oddelený zoznam ďalších origin-ov
const allowedOrigins = [
  "http://localhost:5173",
  "https://archiveapp.pages.dev",
  process.env.FRONTEND_URL ?? "",
  ...(process.env.CORS_ORIGIN ?? "").split(",").map((s) => s.trim()),
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", basicAuth, itemTypesRouter);
app.use("/api/qr", basicAuth, qrRouter);
app.use("/api/items", basicAuth, itemsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", issues: err.issues });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: "Unique constraint violation", meta: err.meta });
      return;
    }
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`ArchiveApp backend running on http://localhost:${PORT}`);
});
