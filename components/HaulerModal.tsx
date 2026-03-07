'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddHaulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; route: string; retase: number }) => void;
  existingRoutes: string[];
}

export function AddHaulerModal({
  isOpen,
  onClose,
  onSubmit,
  existingRoutes,
}: AddHaulerModalProps) {
  const [name, setName] = useState('');
  const [route, setRoute] = useState('');
  const [customRoute, setCustomRoute] = useState('');
  const [retase, setRetase] = useState(0);
  const [useCustomRoute, setUseCustomRoute] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setRoute('');
      setCustomRoute('');
      setRetase(0);
      setUseCustomRoute(existingRoutes.length === 0);
    }
  }, [isOpen, existingRoutes.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoute = useCustomRoute ? customRoute : route;
    if (name.trim() && finalRoute.trim()) {
      onSubmit({ name: name.trim(), route: finalRoute.trim(), retase });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm animate-slide-up shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h3 className="text-[17px] font-semibold text-[var(--foreground)]">
            Tambah Hauler
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
              Nama Hauler
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: XCMG-23"
              className="w-full px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
              Rute
            </label>
            {existingRoutes.length > 0 && !useCustomRoute ? (
              <div className="space-y-2">
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                  required
                >
                  <option value="">Pilih rute...</option>
                  {existingRoutes.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomRoute(true)}
                  className="text-[13px] text-[var(--primary)] font-medium"
                >
                  + Tambah rute baru
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                  placeholder="Contoh: Jesika → Jety Wolo"
                  className="w-full px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                  required
                />
                {existingRoutes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseCustomRoute(false)}
                    className="text-[13px] text-[var(--primary)] font-medium"
                  >
                    Pilih dari rute yang ada
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
              Retase Awal
            </label>
            <input
              type="number"
              value={retase}
              onChange={(e) => setRetase(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[15px] font-medium text-[var(--foreground)] hover:bg-black/5 transition-colors press-effect"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[var(--primary)] rounded-xl text-[15px] font-medium text-white hover:bg-[var(--primary-hover)] transition-colors press-effect"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteHaulerModalProps {
  isOpen: boolean;
  haulerName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteHaulerModal({
  isOpen,
  haulerName,
  onClose,
  onConfirm,
}: DeleteHaulerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm animate-slide-up shadow-xl">
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-[17px] font-semibold text-[var(--foreground)] mb-2">
            Hapus Hauler
          </h3>
          <p className="text-[14px] text-[var(--muted)]">
            Apakah Anda yakin ingin menghapus <strong>{haulerName}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--muted-bg)] border border-black/5 rounded-xl text-[15px] font-medium text-[var(--foreground)] hover:bg-black/5 transition-colors press-effect"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-[var(--error)] rounded-xl text-[15px] font-medium text-white hover:opacity-90 transition-colors press-effect"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
