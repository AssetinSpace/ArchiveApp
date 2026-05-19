import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cache = new Map<string, string>();

function getPromptsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "prompts"),
    path.resolve(here, "../../prompts"),
    path.resolve(here, "../../../prompts"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "base.md"))) return dir;
  }
  throw new Error("base.md prompt súbor chýba v backend/prompts/");
}

function kindSlug(kind: string): string {
  return kind.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function readBasePrompt(): string {
  const basePath = path.join(getPromptsDir(), "base.md");
  if (!fs.existsSync(basePath)) {
    throw new Error("base.md prompt súbor chýba v backend/prompts/");
  }
  return fs.readFileSync(basePath, "utf-8");
}

/**
 * Načíta len base.md (pre OVERVIEW fotky bez štítkového kontextu).
 */
export function loadBasePrompt(): string {
  const cacheKey = "base-only";
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  const prompt = readBasePrompt();
  cache.set(cacheKey, prompt);
  return prompt;
}

/**
 * Načíta prompt pre daný level a kind.
 * Skladá: base.md + l{level}-{kind_slug}.md (ak existuje)
 */
export function loadPrompt(level: number, kind: string): string {
  const slug = kindSlug(kind);
  const cacheKey = `${level}-${slug}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  let prompt = readBasePrompt();

  const specificPath = path.join(getPromptsDir(), `l${level}-${slug}.md`);
  if (fs.existsSync(specificPath)) {
    prompt += "\n\n---\n\n" + fs.readFileSync(specificPath, "utf-8");
  }

  cache.set(cacheKey, prompt);
  return prompt;
}

/** Vyčistí cache — volať ak sa prompt súbory zmenili za behu */
export function clearPromptCache(): void {
  cache.clear();
}
