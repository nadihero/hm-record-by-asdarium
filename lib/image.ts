/** Max image size after client compression (also enforced on server). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const MAX_DIMENSION = 1920;
/** Smaller default for profile avatars */
const PROFILE_MAX_DIMENSION = 512;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca gambar'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengompres gambar'));
      },
      type,
      quality
    );
  });
}

/**
 * Compress / resize image for reliable upload on slow networks.
 * - Max side 1920px (or smaller for profile)
 * - Prefer JPEG (smaller)
 * - Target under MAX_IMAGE_BYTES (5MB)
 */
export async function prepareImageForUpload(
  file: File,
  options?: { maxDimension?: number; baseName?: string }
): Promise<File> {
  if (!file.type.startsWith('image/') && !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    // Some browsers leave type empty for camera captures
    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('File harus berupa gambar');
    }
  }

  const maxDim = options?.maxDimension ?? MAX_DIMENSION;

  try {
    const img = await loadImageFromFile(file);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    while (blob.size > MAX_IMAGE_BYTES && quality > 0.35) {
      quality -= 0.12;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    if (blob.size > MAX_IMAGE_BYTES) {
      const shrink = Math.sqrt(MAX_IMAGE_BYTES / blob.size) * 0.9;
      canvas.width = Math.max(1, Math.round(width * shrink));
      canvas.height = Math.max(1, Math.round(height * shrink));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.7);
    }

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error(
        `Gambar masih terlalu besar (${formatFileSize(blob.size)}). Maksimal ${formatFileSize(MAX_IMAGE_BYTES)}.`
      );
    }

    const baseName =
      options?.baseName ||
      file.name.replace(/\.[^.]+$/, '') ||
      'image';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    if (file.size <= MAX_IMAGE_BYTES) {
      return file;
    }
    throw err instanceof Error
      ? err
      : new Error('Gagal memproses gambar');
  }
}

/** Profile avatar: max 512px side, smaller file */
export async function prepareProfileImageForUpload(file: File): Promise<File> {
  return prepareImageForUpload(file, {
    maxDimension: PROFILE_MAX_DIMENSION,
    baseName: 'profile',
  });
}

export type UploadProgress = {
  attempt: number;
  maxAttempts: number;
};

/**
 * Fetch with retries for flaky mobile networks.
 * Retries on network errors and 5xx / 408 / 429.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: {
    maxAttempts?: number;
    onRetry?: (info: UploadProgress) => void;
  }
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? 4;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(input, init);
      const retriable =
        res.status === 408 ||
        res.status === 429 ||
        res.status >= 500;

      if (retriable && attempt < maxAttempts) {
        options?.onRetry?.({ attempt, maxAttempts });
        await sleep(backoffMs(attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Jaringan terputus');
      if (attempt < maxAttempts) {
        options?.onRetry?.({ attempt, maxAttempts });
        await sleep(backoffMs(attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Upload gagal setelah beberapa percobaan');
}

function backoffMs(attempt: number): number {
  // 1s, 2s, 4s (+ small jitter)
  const base = Math.min(1000 * 2 ** (attempt - 1), 8000);
  return base + Math.floor(Math.random() * 300);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
