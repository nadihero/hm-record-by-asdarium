// Client-side auth utilities only (no Prisma imports)

export interface AuthUser {
  id: string;
  nama: string;
  role: 'admin' | 'employee';
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('user');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('isLoggedIn', 'true');
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
}
