'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, BarChart3, Truck } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/upload', icon: Camera, label: 'Upload' },
  { href: '/report', icon: BarChart3, label: 'Laporan' },
  { href: '/hauler', icon: Truck, label: 'Hauler' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="max-w-md mx-auto px-4 pb-2">
        <div className="bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl shadow-lg shadow-black/5">
          <div className="grid grid-cols-4 gap-1 p-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center py-2.5 rounded-xl transition-all press-effect
                    ${isActive
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
