'use client';

import { ArrowLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearStoredUser } from '@/lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showLogout?: boolean;
}

export default function Header({ title, subtitle, showBack = false, showLogout = false }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    clearStoredUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5" id="header">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
            </button>
          )}
          <div className="flex flex-col justify-center">
            <h1 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
            {subtitle && <p className="text-[13px] text-[var(--muted)] leading-tight">{subtitle}</p>}
          </div>
        </div>

        {showLogout && (
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
            aria-label="Keluar"
          >
            <LogOut className="w-[18px] h-[18px] text-[var(--muted)]" />
          </button>
        )}
      </div>
    </header>
  );
}
