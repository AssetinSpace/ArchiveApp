import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REALM = 'Basic realm="ArchiveApp"';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Stále spravíme porovnanie rovnakej dĺžky, aby dĺžka nešla cez side-channel
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    res.status(500).json({
      error: "Server misconfigured: BASIC_AUTH_USER / BASIC_AUTH_PASS not set",
    });
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("basic ")) {
    res.setHeader("WWW-Authenticate", REALM);
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const b64 = header.slice("basic ".length).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    res.setHeader("WWW-Authenticate", REALM);
    res.status(401).json({ error: "Malformed credentials" });
    return;
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) {
    res.setHeader("WWW-Authenticate", REALM);
    res.status(401).json({ error: "Malformed credentials" });
    return;
  }
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const ok = safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
  if (!ok) {
    res.setHeader("WWW-Authenticate", REALM);
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  next();
}
