import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ITEM_TYPES: Array<{ code: string; label: string }> = [
  { code: "SKLAD", label: "Sklad" },
  { code: "PALETA", label: "Paleta" },
  { code: "KRABICA", label: "Krabica" },
  { code: "ZLOZKA", label: "Zložka" },
];

async function main() {
  for (const t of ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { code: t.code },
      update: { label: t.label },
      create: t,
    });
  }
  console.log(`Seeded ${ITEM_TYPES.length} ItemTypes`);

  const sklady = ["Sklad A", "Sklad B", "Sklad C"];
  const skladEntities: Record<string, { id: string }> = {};
  for (const name of sklady) {
    const existing = await prisma.item.findFirst({
      where: { type_code: "SKLAD", name, parent_id: null, deleted_at: null },
    });
    const sklad =
      existing ??
      (await prisma.item.create({
        data: { type_code: "SKLAD", name, parent_id: null },
      }));
    skladEntities[name] = sklad;
  }
  console.log(`Seeded ${sklady.length} sklady`);

  const skladA = skladEntities["Sklad A"];
  if (!skladA) throw new Error("Sklad A missing after seed");

  const paletyNames = ["Paleta 1", "Paleta 2", "Paleta 3"];
  let created = 0;
  for (const name of paletyNames) {
    const exists = await prisma.item.findFirst({
      where: {
        type_code: "PALETA",
        name,
        parent_id: skladA.id,
        deleted_at: null,
      },
    });
    if (!exists) {
      await prisma.item.create({
        data: { type_code: "PALETA", name, parent_id: skladA.id },
      });
      created++;
    }
  }
  console.log(`Seeded ${created} new palety in Sklad A (${paletyNames.length} total)`);
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
