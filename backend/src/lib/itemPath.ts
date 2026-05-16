import { prisma } from "../prisma.js";

export type PathNode = {
  id: string;
  type_code: string;
  name: string | null;
  parent_id: string | null;
};

// Vráti cestu od koreňa po danú položku (vrátane).
// Bezpečné voči (hypotetickým) cyklom — `seen` set.
export async function getItemPath(itemId: string): Promise<PathNode[]> {
  const start = await prisma.item.findFirst({
    where: { id: itemId, deleted_at: null },
    select: { id: true, type_code: true, name: true, parent_id: true },
  });
  if (!start) return [];

  const path: PathNode[] = [start];
  let cursor: string | null = start.parent_id;
  const seen = new Set<string>([start.id]);
  while (cursor) {
    if (seen.has(cursor)) break;
    seen.add(cursor);
    const node: PathNode | null = await prisma.item.findFirst({
      where: { id: cursor, deleted_at: null },
      select: { id: true, type_code: true, name: true, parent_id: true },
    });
    if (!node) break;
    path.push(node);
    cursor = node.parent_id;
  }
  path.reverse();
  return path;
}
