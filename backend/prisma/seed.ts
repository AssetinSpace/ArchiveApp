import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ITEM_IDS = {
  SKLAD_A: "a0000001-0001-4001-8001-000000000001",
  SKLAD_B: "a0000001-0001-4001-8001-000000000002",
  SKLAD_C: "a0000001-0001-4001-8001-000000000003",
  OHRADKA_1: "c0000001-0001-4001-8001-000000000001",
  POLICA_1: "d0000001-0001-4001-8001-000000000001",
  POLICA_2: "d0000001-0001-4001-8001-000000000002",
} as const;

type ItemKey = {
  level: number;
  kind: string;
  name: string;
  parent_id: string | null;
};

async function upsertItem(
  key: ItemKey,
  seedId: string,
  data: ItemKey & { name_source?: string },
) {
  const existing = await prisma.item.findFirst({
    where: { ...key, deleted_at: null },
  });
  const id = existing?.id ?? seedId;
  return prisma.item.upsert({
    where: { id },
    update: {
      level: data.level,
      kind: data.kind,
      name: data.name,
      parent_id: data.parent_id,
      name_source: data.name_source ?? "MANUAL",
    },
    create: {
      id,
      level: data.level,
      kind: data.kind,
      name: data.name,
      parent_id: data.parent_id,
      name_source: data.name_source ?? "MANUAL",
    },
  });
}

async function main() {
  const skladA = await upsertItem(
    { level: 1, kind: "SKLAD", name: "Sklad A", parent_id: null },
    SEED_ITEM_IDS.SKLAD_A,
    { level: 1, kind: "SKLAD", name: "Sklad A", parent_id: null, name_source: "MANUAL" },
  );
  await upsertItem(
    { level: 1, kind: "SKLAD", name: "Sklad B", parent_id: null },
    SEED_ITEM_IDS.SKLAD_B,
    { level: 1, kind: "SKLAD", name: "Sklad B", parent_id: null, name_source: "MANUAL" },
  );
  await upsertItem(
    { level: 1, kind: "SKLAD", name: "Sklad C", parent_id: null },
    SEED_ITEM_IDS.SKLAD_C,
    { level: 1, kind: "SKLAD", name: "Sklad C", parent_id: null, name_source: "MANUAL" },
  );
  console.log("Seeded 3 sklady (L1)");

  const ohradka = await upsertItem(
    { level: 2, kind: "OHRADKA", name: "Ohradka 1", parent_id: skladA.id },
    SEED_ITEM_IDS.OHRADKA_1,
    { level: 2, kind: "OHRADKA", name: "Ohradka 1", parent_id: skladA.id, name_source: "MANUAL" },
  );
  console.log("Seeded 1 ohradka (L2) in Sklad A");

  for (const { name, seedId } of [
    { name: "Polica 1", seedId: SEED_ITEM_IDS.POLICA_1 },
    { name: "Polica 2", seedId: SEED_ITEM_IDS.POLICA_2 },
  ]) {
    await upsertItem(
      { level: 3, kind: "POLICA", name, parent_id: ohradka.id },
      seedId,
      { level: 3, kind: "POLICA", name, parent_id: ohradka.id, name_source: "MANUAL" },
    );
  }
  console.log("Seeded 2 police (L3) in Ohradka 1");
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
