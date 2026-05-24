import type { PrismaClient } from "@prisma/client";

export type QrAssignmentResult =
  | { status: "ASSIGNED"; qrCode: string }
  | { status: "NOT_FOUND"; qrCode: string }
  | { status: "ALREADY_ASSIGNED"; qrCode: string; assignedToItemId: string }
  | { status: "ITEM_HAS_QR"; existingQrCode: string }
  | { status: "NO_QR_DETECTED" };

/**
 * Attempts to assign a decoded QR code to an item.
 * All DB state checks and the final atomic assignment run here.
 * Never throws — call sites must not let a failed assignment abort the upload.
 */
export async function tryAssignDetectedQr(
  itemId: string,
  detectedCode: string | null,
  db: PrismaClient,
): Promise<QrAssignmentResult> {
  if (detectedCode === null) {
    return { status: "NO_QR_DETECTED" };
  }

  const item = await db.item.findFirst({
    where: { id: itemId, deleted_at: null },
    select: { id: true, qr_code: true },
  });

  if (!item) {
    // Item disappeared between photo create and here — treat as no-op.
    return { status: "NO_QR_DETECTED" };
  }

  if (item.qr_code) {
    return { status: "ITEM_HAS_QR", existingQrCode: item.qr_code };
  }

  const tag = await db.qRTag.findUnique({
    where: { code: detectedCode },
    select: { id: true, status: true, assigned_item_id: true },
  });

  if (!tag) {
    return { status: "NOT_FOUND", qrCode: detectedCode };
  }

  if (tag.status === "ASSIGNED" && tag.assigned_item_id !== itemId) {
    return {
      status: "ALREADY_ASSIGNED",
      qrCode: detectedCode,
      assignedToItemId: tag.assigned_item_id as string,
    };
  }

  // Atomically mark tag ASSIGNED and set qr_code on the item.
  await db.$transaction([
    db.qRTag.update({
      where: { code: detectedCode },
      data: { status: "ASSIGNED", assigned_item_id: itemId },
    }),
    db.item.update({
      where: { id: itemId },
      data: { qr_code: detectedCode },
    }),
  ]);

  return { status: "ASSIGNED", qrCode: detectedCode };
}
