/**
 * Timesheet image storage — Cloudflare R2 only.
 * Objects live in R2; the app serves them via /api/uploads/* (S3 GetObject).
 * Does not rely on public bucket / r2.dev (avoids TLS & access issues).
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extractStorageKey } from '@/lib/foto-url';

export { extractStorageKey, resolveFotoUrl } from '@/lib/foto-url';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v || v.includes('your_') || v.includes('example')) {
    throw new Error(`R2_NOT_CONFIGURED:${name}`);
  }
  return v;
}

export function assertR2Configured(): void {
  requireEnv('R2_ACCOUNT_ID');
  requireEnv('R2_ACCESS_KEY_ID');
  requireEnv('R2_SECRET_ACCESS_KEY');
  requireEnv('R2_BUCKET_NAME');
}

export function isR2Configured(): boolean {
  try {
    assertR2Configured();
    return true;
  } catch {
    return false;
  }
}

function getR2Client(): S3Client {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function getBucket(): string {
  return requireEnv('R2_BUCKET_NAME');
}

function safeExt(fileName: string, mime?: string): string {
  const raw = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(raw)) {
    return raw === 'jpeg' ? 'jpg' : raw;
  }
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('webp')) return 'webp';
  if (mime?.includes('gif')) return 'gif';
  return 'jpg';
}

function contentTypeForExt(ext: string): string {
  return CONTENT_TYPES[ext] || 'image/jpeg';
}

export function validateImageFile(file: File): void {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  if (
    file.type &&
    !file.type.startsWith('image/') &&
    file.type !== 'application/octet-stream'
  ) {
    throw new Error('INVALID_FILE_TYPE');
  }
}

/**
 * Upload image to R2 under a folder prefix. Returns /api/uploads/{key} for DB.
 */
export async function uploadR2Image(
  file: File,
  folder: 'timesheets' | 'profiles' = 'timesheets'
): Promise<string> {
  assertR2Configured();
  validateImageFile(file);

  const ext = safeExt(file.name, file.type);
  const key = `${folder}/${uuidv4()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  const contentType = contentTypeForExt(ext);

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `/api/uploads/${key}`;
}

export async function uploadTimesheetImage(file: File): Promise<string> {
  return uploadR2Image(file, 'timesheets');
}

export async function uploadProfileImage(file: File): Promise<string> {
  return uploadR2Image(file, 'profiles');
}

export async function deleteTimesheetImage(
  fotoPath: string | null | undefined
): Promise<void> {
  if (!fotoPath) return;
  const key = extractStorageKey(fotoPath);
  if (!key) return;

  try {
    assertR2Configured();
    const client = getR2Client();
    const keys = new Set([key]);
    const base = key.split('/').pop();
    if (base) {
      keys.add(`timesheets/${base}`);
      keys.add(`profiles/${base}`);
    }

    for (const k of keys) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: k,
          })
        );
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.error('R2 delete failed:', err);
  }
}

/** Alias for profile photo cleanup */
export const deleteProfileImage = deleteTimesheetImage;

export type StoredImage = {
  body: Buffer;
  contentType: string;
};

export async function getTimesheetImage(
  rawKey: string
): Promise<StoredImage | null> {
  assertR2Configured();

  const key = rawKey.replace(/\.\./g, '').replace(/^\/+/, '');
  if (!key) return null;

  const client = getR2Client();
  const candidates = [key];
  if (!key.includes('/')) {
    candidates.push(`timesheets/${key}`);
  }

  for (const k of candidates) {
    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: getBucket(),
          Key: k,
        })
      );
      if (res.Body) {
        const bytes = await res.Body.transformToByteArray();
        const ext = safeExt(k);
        return {
          body: Buffer.from(bytes),
          contentType: res.ContentType || contentTypeForExt(ext),
        };
      }
    } catch {
      // try next
    }
  }

  return null;
}

export async function deleteAllTimesheetImages(): Promise<number> {
  assertR2Configured();
  const client = getR2Client();
  const bucket = getBucket();
  let deleted = 0;
  let token: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'timesheets/',
        ContinuationToken: token,
      })
    );
    const contents = list.Contents || [];
    for (const obj of contents) {
      if (!obj.Key) continue;
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key })
      );
      deleted += 1;
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);

  return deleted;
}
