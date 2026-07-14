/**
 * Client-safe helpers to normalize fotoPath → browser URL.
 * No AWS SDK (safe to import from client components).
 */

/**
 * Extract R2 object key from stored fotoPath.
 */
export function extractStorageKey(fotoPath: string): string | null {
  if (!fotoPath) return null;
  try {
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      const url = new URL(fotoPath);
      const key = url.pathname.replace(/^\//, '');
      return key || null;
    }
  } catch {
    // ignore
  }
  if (fotoPath.startsWith('/api/uploads/')) {
    return fotoPath.slice('/api/uploads/'.length).replace(/^\/+/, '') || null;
  }
  if (fotoPath.startsWith('timesheets/')) return fotoPath;
  const base = fotoPath.split('/').pop();
  return base ? `timesheets/${base}` : null;
}

/**
 * Always serve via app proxy so private R2 works in browser.
 * Handles: public r2.dev URL, /api/uploads/..., bare keys.
 */
export function resolveFotoUrl(fotoPath: string | null | undefined): string {
  if (!fotoPath) return '';
  const key = extractStorageKey(fotoPath);
  if (!key) return '';
  return `/api/uploads/${key}`;
}
