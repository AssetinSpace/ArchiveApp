-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NA_MIESTE', 'VYNESENE', 'NEZNAME');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('FREE', 'ASSIGNED');

-- CreateTable
CREATE TABLE "ItemType" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,
    "name" TEXT,
    "parent_id" TEXT,
    "qr_code" TEXT,
    "note" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NA_MIESTE',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRTag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "QrStatus" NOT NULL DEFAULT 'FREE',
    "assigned_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "ocr_raw_text" TEXT,
    "ocr_status" "OcrStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_qr_code_key" ON "Item"("qr_code");

-- CreateIndex
CREATE INDEX "Item_parent_id_idx" ON "Item"("parent_id");

-- CreateIndex
CREATE INDEX "Item_type_code_idx" ON "Item"("type_code");

-- CreateIndex
CREATE INDEX "Item_deleted_at_idx" ON "Item"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "QRTag_code_key" ON "QRTag"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QRTag_assigned_item_id_key" ON "QRTag"("assigned_item_id");

-- CreateIndex
CREATE INDEX "Photo_item_id_idx" ON "Photo"("item_id");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "ItemType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRTag" ADD CONSTRAINT "QRTag_assigned_item_id_fkey" FOREIGN KEY ("assigned_item_id") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
