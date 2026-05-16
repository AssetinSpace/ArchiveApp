/*
  Warnings:

  - You are about to drop the column `storage_url` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "storage_url",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Photo_ocr_status_idx" ON "Photo"("ocr_status");

-- CreateIndex
CREATE INDEX "Photo_deleted_at_idx" ON "Photo"("deleted_at");
