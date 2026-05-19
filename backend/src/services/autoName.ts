// Auto-name service — Sprint 5.
//
// Generuje pozičný identifikátor na základe pozície položky v hierarchii:
//   sklA_pal003_kra004_zlo015
//
// Princípy (PROJECT.md §4.1, Sprint 5 spec):
// - Volá sa pri POST /api/items po validácii rodiča, pred prisma.item.create.
// - Pre koreňové položky (SKLAD bez parenta) vraciame null — sklady sa
//   vytvárajú cez seed, nie v teréne.
// - SKLAD segment používa name (Sklad A → "sklA"), fallback qr_code → id.
// - PALETA/KRABICA/ZLOZKA segmenty používajú sequence číslo per-rodič
//   (NIE QR kódy — tie sú globálne sekvenčné, nie per-rodič).
// - Sequence pre nový item = COUNT aktívnych siblings rovnakého type_code
//   pod tým rodičom + 1. Edge case: po soft-delete sa môže auto_name znovu
//   použiť pre novú položku — checkNameConflict v items.ts zachytí pre `name`.
// - Pre ancestor segmenty preferujeme ich uložené `auto_name` (nové items).
//   Ak chýba (legacy items pred Sprint 5), spočítame sequence ako pozíciu
//   medzi aktívnymi siblings podľa created_at.

import { prisma } from "../prisma.js";

const TYPE_PREFIX: Record<string, string> = {
  SKLAD: "skl",
  PALETA: "pal",
  KRABICA: "kra",
  ZLOZKA: "zlo",
};

// Vyberie diskriminátor pre SKLAD segment z dostupných polí.
// Preferujeme name (najľudskejšie — "Sklad A" → "A"), inak qr_code, inak id.
function skladDiscriminator(node: {
  name: string | null;
  qr_code: string | null;
  id: string;
}): string {
  if (node.name) {
    const trimmed = node.name.trim();
    if (trimmed) {
      // Berieme posledné slovo (často "A"/"B"/"C") a z neho prvý non-space char.
      // "Sklad A" → "A", "A" → "A", "Hlavný sklad" → "s".
      const parts = trimmed.split(/\s+/);
      const last = parts[parts.length - 1];
      const firstChar = last.charAt(0);
      if (firstChar) return firstChar;
    }
  }
  if (node.qr_code && node.qr_code.length > 0) {
    return node.qr_code.slice(0, 3);
  }
  return node.id.slice(0, 3);
}

// Spočíta segment pre konkrétny ancestor item — buď zo SKLAD diskriminátora
// alebo zo sequence pozície medzi aktívnymi siblings (podľa created_at).
async function computeAncestorSegment(node: {
  id: string;
  type_code: string | null;
  kind?: string;
  name: string | null;
  qr_code: string | null;
  parent_id: string | null;
  created_at: Date;
}): Promise<string> {
  const typeKey = node.type_code ?? node.kind ?? "item";
  const prefix = TYPE_PREFIX[typeKey];
  if (!prefix) {
    return typeKey.toLowerCase().slice(0, 3) + node.id.slice(0, 3);
  }
  if (typeKey === "SKLAD") {
    return prefix + skladDiscriminator(node);
  }
  // Sequence = počet aktívnych siblings vytvorených pred (alebo súčasne s)
  // týmto uzlom — t.j. jeho pozícia v poradí + 1 sa dosiahne tým že rátame
  // <= created_at. Pre rovnaké timestamp-y je výsledok stabilný len ak sa
  // používa konzistentne; v praxi sa kolízie nestávajú (ms presnosť).
  const seq = await prisma.item.count({
    where: {
      ...(node.type_code
        ? { type_code: node.type_code }
        : { kind: node.kind ?? typeKey }),
      parent_id: node.parent_id,
      deleted_at: null,
      created_at: { lte: node.created_at },
    },
  });
  return prefix + String(seq).padStart(3, "0");
}

// Zostaví celú prefix-cestu (sklA_pal003_kra004) pre danú položku, vrátane
// jej samej. Preferuje uložené auto_name ak je dostupné, inak vypočíta path
// od koreňa cez computeAncestorSegment.
async function buildPathPrefix(itemId: string): Promise<string | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, deleted_at: null },
    select: {
      id: true,
      type_code: true,
      kind: true,
      name: true,
      qr_code: true,
      parent_id: true,
      created_at: true,
      auto_name: true,
    },
  });
  if (!item) return null;
  if (item.auto_name) return item.auto_name;

  // Legacy item (pred Sprint 5) — postavíme z koreňa.
  const segments: string[] = [];
  let cursor: typeof item | null = item;
  const seen = new Set<string>();
  while (cursor) {
    if (seen.has(cursor.id)) break;
    seen.add(cursor.id);
    segments.unshift(await computeAncestorSegment(cursor));
    if (!cursor.parent_id) break;
    cursor = await prisma.item.findFirst({
      where: { id: cursor.parent_id, deleted_at: null },
      select: {
        id: true,
        type_code: true,
        kind: true,
        name: true,
        qr_code: true,
        parent_id: true,
        created_at: true,
        auto_name: true,
      },
    });
    if (cursor?.auto_name) {
      // Ak po ceste hore narazíme na ancestor s auto_name, preferujeme ho —
      // jeho auto_name pokrýva celú cestu od koreňa po neho.
      segments.unshift(cursor.auto_name);
      return segments.join("_");
    }
  }
  return segments.join("_");
}

// Hlavný entry point: vygeneruje auto_name pre nový Item s daným parentId
// a typeCode. Vracia null pre koreňové položky alebo neznáme typy.
export async function generateAutoName(
  parentId: string | null,
  typeCode: string,
): Promise<string | null> {
  if (!parentId) return null;
  const prefix = TYPE_PREFIX[typeCode];
  if (!prefix) return null;

  const parentPrefix = await buildPathPrefix(parentId);
  if (parentPrefix === null) return null;

  // Sequence pre nový item = COUNT aktívnych siblings rovnakého typu + 1.
  const siblingCount = await prisma.item.count({
    where: {
      type_code: typeCode,
      parent_id: parentId,
      deleted_at: null,
    },
  });
  const newSegment = prefix + String(siblingCount + 1).padStart(3, "0");

  return `${parentPrefix}_${newSegment}`;
}
