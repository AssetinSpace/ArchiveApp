import sharp from "sharp";
import pkg from "@zxing/library";
// DecodeHintType is used both as a runtime value (enum member access) and as a
// type (Map key). After the default-import fix the destructured binding is
// value-only, so we import the type separately under an alias.
import type { DecodeHintType as DecodeHintTypeEnum } from "@zxing/library";
const {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  NotFoundException,
  RGBLuminanceSource,
} = pkg;

// Exported for unit testing.
export function decodeQrFromRgb(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string | null {
  const hints = new Map<DecodeHintTypeEnum, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  const source = new RGBLuminanceSource(data, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const result = reader.decode(bitmap);
  return result.getText();
}

/**
 * Attempts to decode a QR code from an image buffer.
 * Returns the decoded string, or null if no QR code is found or on any error.
 * Never throws — a failed detection must not abort the photo upload.
 */
export async function detectQrFromImage(
  buffer: Buffer,
  timeoutMs = 2000,
): Promise<string | null> {
  const detect = async (): Promise<string | null> => {
    try {
      // grayscale() → 1 byte per pixel (luminance). RGBLuminanceSource treats a
      // Uint8ClampedArray as a pre-computed luminance array (BYTES_PER_ELEMENT === 1
      // branch in the constructor). removeAlpha() would give 3 bytes/px which is
      // 3× too long and produces garbled luminance — always use grayscale() here.
      const { data, info } = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const uint8 = new Uint8ClampedArray(
        data.buffer,
        data.byteOffset,
        data.byteLength,
      );

      return decodeQrFromRgb(uint8, info.width, info.height);
    } catch (err) {
      if (err instanceof NotFoundException) {
        return null;
      }
      console.warn("[qrDetection] QR decode failed (non-fatal):", err);
      return null;
    }
  };

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), timeoutMs),
  );

  return Promise.race([detect(), timeout]);
}
