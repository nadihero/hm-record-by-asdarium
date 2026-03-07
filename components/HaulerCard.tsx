'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Hauler } from '@/lib/hauler';

interface HaulerCardProps {
  hauler: Hauler;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HaulerCard({
  hauler,
  onIncrement,
  onDecrement,
  onDelete,
}: HaulerCardProps) {
  const initials = hauler.name.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[var(--foreground)] truncate">
          {hauler.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {hauler.route && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
              {hauler.route}
            </span>
          )}
          <span className="text-[13px] text-[var(--muted)]">
            {hauler.retase} retase
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrement(hauler.id)}
          disabled={hauler.retase <= 0}
          className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] transition-all press-effect hover:bg-[var(--primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Kurangi retase"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onIncrement(hauler.id)}
          className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] transition-all press-effect hover:bg-[var(--primary)]/20"
          aria-label="Tambah retase"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(hauler.id)}
          className="w-9 h-9 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)] transition-all press-effect hover:bg-[var(--error)]/20"
          aria-label="Hapus hauler"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
