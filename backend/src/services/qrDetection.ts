import sharp from "sharp";
import pkg from "@zxing/library";
// DecodeHintType is used both as a runtime value (enum member access) and as a
// type (Map key). After the default-import fix the destructured binding is
// value-only, so we import the type separately under an alias.
import type { DecodeHintType as DecodeHintTypeT } from "@zxing/library";
const {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} = pkg;

async function tryDecodeAtScale(buffer: Buffer, width: number): Promise<string | null> {
  try {
    const { data, info } = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // RGB Buffer → Int32Array vo formáte ARGB pre @zxing
    const luminances = new Int32Array(info.width * info.height);
    for (let i = 0; i < luminances.length; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      luminances[i] = (0xff << 24) | (r << 16) | (g << 8) | b;
    }

    const luminanceSource = new RGBLuminanceSource(luminances, info.width, info.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const hints = new Map<DecodeHintTypeT, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const result = reader.decode(binaryBitmap);
    return result.getText();
  } catch {
    // NotFoundException = nič nenašiel, čokoľvek iné = corrupted buffer / sharp error
    // V oboch prípadoch len skús ďalší scale, nehádz von
    return null;
  }
}

const DETECTION_SCALES = [1024, 1280, 768] as const;

/**
 * Attempts to decode a QR code from an image buffer using multi-scale retry.
 * Returns the decoded string, or null if no QR code is found or on any error.
 * Never throws — a failed detection must not abort the photo upload.
 */
export async function detectQrFromImage(
  buffer: Buffer,
  timeoutMs: number = 2000,
): Promise<string | null> {
  const detection = (async () => {
    for (const width of DETECTION_SCALES) {
      const result = await tryDecodeAtScale(buffer, width);
      if (result) {
        console.log(`[qrDetection] detected at ${width}px: ${result}`);
        return result;
      }
    }
    return null;
  })();

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), timeoutMs),
  );

  try {
    return await Promise.race([detection, timeout]);
  } catch {
    return null;
  }
}
