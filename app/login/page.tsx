'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, ArrowRight } from 'lucide-react';
import { setStoredUser, AuthUser } from '@/lib/auth';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'PIN tidak valid');
        setIsLoading(false);
        return;
      }

      const user: AuthUser = data.user;
      setStoredUser(user);

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      setError('Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-5">
          <img src="/cjtp.webp" alt="CJTP" className="w-40 h-auto object-contain mx-auto" />
          <h1 className="text-[18px] font-bold tracking-tight text-[var(--foreground)]">Ceria Jasa Tambang Pratama</h1>
        </div>

        {/* Login Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">PIN Akses</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="•••••"
                className="w-full h-14 px-4 text-center text-[24px] tracking-[0.5em] font-medium bg-[var(--muted-bg)] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 transition-shadow"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--error)]/10 rounded-xl">
                <p className="text-[14px] font-medium text-[var(--error)]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pin.length < 5 || isLoading}
              className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all press-effect"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[13px] text-[var(--muted)] mt-8">
          &copy; {new Date().getFullYear()} <a href="https://wa.me/6282259680503" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Asdarium</a>. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
