// Mapuje typ položky na typ jej povinného rodiča.
// SKLAD je koreň stromu (nemá rodiča).
// Používa sa pri validácii v POST /api/items a pri filtrovaní možných rodičov v UI.
export const PARENT_TYPE_BY_CHILD: Record<string, string | null> = {
  SKLAD: null,
  PALETA: "SKLAD",
  KRABICA: "PALETA",
  ZLOZKA: "KRABICA",
};

// Inverzná mapa — pre daný typ rodiča vráti typ ktorý môže byť jeho dieťaťom.
// Používa sa v UI pri tlačidle "Pridať dieťa" na ItemDetailPage.
export const CHILD_TYPE_BY_PARENT: Record<string, string> = {
  SKLAD: "PALETA",
  PALETA: "KRABICA",
  KRABICA: "ZLOZKA",
};

export const KNOWN_TYPES = ["SKLAD", "PALETA", "KRABICA", "ZLOZKA"] as const;
