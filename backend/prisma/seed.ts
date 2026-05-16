import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ITEM_TYPES: Array<{ code: string; label: string }> = [
  { code: "SKLAD", label: "Sklad" },
  { code: "PALETA", label: "Paleta" },
  { code: "KRABICA", label: "Krabica" },
  { code: "ZLOZKA", label: "Zložka" },
];

const SEED_ITEM_IDS = {
  SKLAD_A: "a0000001-0001-4001-8001-000000000001",
  SKLAD_B: "a0000001-0001-4001-8001-000000000002",
  SKLAD_C: "a0000001-0001-4001-8001-000000000003",
  PALETA_1: "b0000001-0001-4001-8001-000000000001",
  PALETA_2: "b0000001-0001-4001-8001-000000000002",
  PALETA_3: "b0000001-0001-4001-8001-000000000003",
} as const;

type ItemKey = {
  type_code: string;
  name: string;
  parent_id: string | null;
};

async function upsertItem(
  key: ItemKey,
  seedId: string,
  data: ItemKey,
) {
  const existing = await prisma.item.findFirst({
    where: { ...key, deleted_at: null },
  });
  const id = existing?.id ?? seedId;
  return prisma.item.upsert({
    where: { id },
    update: {
      type_code: data.type_code,
      name: data.name,
      parent_id: data.parent_id,
    },
    create: {
      id,
      type_code: data.type_code,
      name: data.name,
      parent_id: data.parent_id,
    },
  });
}

async function main() {
  for (const t of ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { code: t.code },
      update: { label: t.label },
      create: t,
    });
  }
  console.log(`Seeded ${ITEM_TYPES.length} ItemTypes`);

  const skladA = await upsertItem(
    { type_code: "SKLAD", name: "Sklad A", parent_id: null },
    SEED_ITEM_IDS.SKLAD_A,
    { type_code: "SKLAD", name: "Sklad A", parent_id: null },
  );
  await upsertItem(
    { type_code: "SKLAD", name: "Sklad B", parent_id: null },
    SEED_ITEM_IDS.SKLAD_B,
    { type_code: "SKLAD", name: "Sklad B", parent_id: null },
  );
  await upsertItem(
    { type_code: "SKLAD", name: "Sklad C", parent_id: null },
    SEED_ITEM_IDS.SKLAD_C,
    { type_code: "SKLAD", name: "Sklad C", parent_id: null },
  );
  console.log("Seeded 3 sklady");

  const palety: Array<{ name: string; seedId: string }> = [
    { name: "Paleta 1", seedId: SEED_ITEM_IDS.PALETA_1 },
    { name: "Paleta 2", seedId: SEED_ITEM_IDS.PALETA_2 },
    { name: "Paleta 3", seedId: SEED_ITEM_IDS.PALETA_3 },
  ];
  for (const { name, seedId } of palety) {
    await upsertItem(
      { type_code: "PALETA", name, parent_id: skladA.id },
      seedId,
      { type_code: "PALETA", name, parent_id: skladA.id },
    );
  }
  console.log(`Seeded ${palety.length} palety in Sklad A`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
