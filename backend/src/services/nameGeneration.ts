import { prisma } from "../prisma.js";

/**
 * Generuje zastupný name pre novú položku.
 * Formát: "{kind_lowercase}_{poradie_medzi_súrodencami}"
 * Príklady: "polica_5", "krabica_12", "zlozka_7"
 */
export async function generateName(
  parentId: string | null,
  kind: string,
): Promise<string> {
  const kindSlug =
    kind
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || "item";

  const count = await prisma.item.count({
    where: {
      parent_id: parentId,
      kind: kind,
      deleted_at: null,
    },
  });

  return `${kindSlug}_${count + 1}`;
}
