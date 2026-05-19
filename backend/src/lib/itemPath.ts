import { prisma } from "../prisma.js";

export type PathNode = {
  id: string;
  level: number;
  kind: string;
  name: string;
  parent_id: string | null;
  type_code?: string | null;
};

export async function getItemPath(itemId: string): Promise<PathNode[]> {
  const start = await prisma.item.findFirst({
    where: { id: itemId, deleted_at: null },
    select: {
      id: true,
      level: true,
      kind: true,
      name: true,
      parent_id: true,
      type_code: true,
    },
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
      select: {
        id: true,
        level: true,
        kind: true,
        name: true,
        parent_id: true,
        type_code: true,
      },
    });
    if (!node) break;
    path.push(node);
    cursor = node.parent_id;
  }
  path.reverse();
  return path;
}
