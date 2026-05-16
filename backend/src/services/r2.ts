// Tenký wrapper nad Cloudflare R2 cez AWS SDK v3 (R2 hovorí S3 protokolom).
// Volajúci si key skladá sám (viď routes/photos.ts pre formát photos/YYYY/itemId/uuid.ext).
// Signed URL = krátkodobý GET token (default 15 min) — generuje sa on-demand pri každej
// odpovedi, do DB ho neukladáme.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Fail-fast: ak chýba akýkoľvek z R2 envov, padneme hneď pri prvom importe modulu
// (najneskôr pri prvom uploade) namiesto nečitateľnej chyby z hĺbky SDK.
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `R2 misconfigured: env ${name} is missing. Set it in backend/.env (lokálne) alebo v Railway Variables (produkcia).`,
    );
  }
  return v;
}

const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = requireEnv("R2_SECRET_ACCESS_KEY");
const BUCKET = requireEnv("R2_BUCKET_NAME");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function getSignedUrlForKey(
  key: string,
  expiresInSeconds = 900,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function getObjectAsBuffer(key: string): Promise<Buffer> {
  const response = await r2.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const chunks: Buffer[] = [];
  // Body je v Node.js Readable stream — iterujeme cez async iterator.
  for await (const chunk of response.Body as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
