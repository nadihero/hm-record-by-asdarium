'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';

interface AbsensiFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type StatusType = 'hadir' | 'alpa' | 'sakit' | 'cuti';

const statusConfig = {
  hadir: { label: 'Hadir', color: 'var(--success)', bg: 'var(--success)' },
  alpa: { label: 'Alpa', color: 'var(--error)', bg: 'var(--error)' },
  sakit: { label: 'Sakit', color: 'var(--warning)', bg: 'var(--warning)' },
  cuti: { label: 'Cuti', color: 'var(--primary)', bg: 'var(--primary)' },
};

export default function AbsensiForm({ onSuccess, onCancel }: AbsensiFormProps) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StatusType>('hadir');
  const [jamMasuk, setJamMasuk] = useState('08:00');
  const [jamPulang, setJamPulang] = useState('17:00');
  const [keterangan, setKeterangan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === 'employee') {
      setEmployeeId(user.id);
    }
  }, []);

  const showTimeFields = status === 'hadir';
  const requireKeterangan = status === 'sakit' || status === 'cuti';

  const handleSubmit = async () => {
    if (!employeeId) {
      setError('User tidak ditemukan');
      return;
    }

    if (showTimeFields && (!jamMasuk || !jamPulang)) {
      setError('Jam masuk dan pulang wajib diisi');
      return;
    }

    if (showTimeFields && jamPulang <= jamMasuk) {
      setError('Jam pulang harus setelah jam masuk');
      return;
    }

    if (requireKeterangan && !keterangan.trim()) {
      setError('Keterangan wajib diisi untuk status ' + status);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          tanggal,
          jamMasuk: showTimeFields ? jamMasuk : null,
          jamPulang: showTimeFields ? jamPulang : null,
          status,
          keterangan: keterangan.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan absensi');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setStatus('hadir');
    setJamMasuk('08:00');
    setJamPulang('17:00');
    setKeterangan('');
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-[var(--success)]" />
        </div>
        <p className="text-[17px] font-semibold text-[var(--foreground)]">Absensi Tersimpan!</p>
        <p className="text-[14px] text-[var(--muted)] mt-1">Data kehadiran berhasil dicatat</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tanggal */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">
          Tanggal
        </label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
        />
      </div>

      {/* Status Selector */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">
          Status Kehadiran
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(statusConfig) as StatusType[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`
                py-3 px-2 rounded-xl text-[13px] font-semibold transition-all press-effect
                ${status === key
                  ? 'text-white'
                  : 'bg-[var(--muted-bg)] text-[var(--muted)] hover:bg-black/10'
                }
              `}
              style={{
                backgroundColor: status === key ? statusConfig[key].bg : undefined,
              }}
            >
              {statusConfig[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Fields - Only show for 'hadir' */}
      {showTimeFields && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">
              Jam Masuk <span className="text-[var(--error)]">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">
              Jam Pulang <span className="text-[var(--error)]">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={jamPulang}
                onChange={(e) => setJamPulang(e.target.value)}
                className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Disabled Time Fields Message */}
      {!showTimeFields && (
        <div className="flex items-center gap-3 p-4 bg-[var(--muted-bg)] rounded-xl">
          <AlertCircle className="w-5 h-5 text-[var(--muted)]" />
          <p className="text-[14px] text-[var(--muted)]">
            Jam masuk/pulang tidak diperlukan untuk status {statusConfig[status].label.toLowerCase()}
          </p>
        </div>
      )}

      {/* Keterangan */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--muted)] mb-2">
          Keterangan {requireKeterangan && <span className="text-[var(--error)]">*</span>}
        </label>
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder={
            status === 'sakit' ? 'Contoh: Demam, izin istirahat...' :
            status === 'cuti' ? 'Contoh: Cuti tahunan, keperluan keluarga...' :
            'Opsional...'
          }
          rows={3}
          className="w-full px-4 py-3 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[var(--error)]/10 rounded-xl">
          <X className="w-5 h-5 text-[var(--error)]" />
          <p className="text-[14px] font-medium text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            className="flex-1 h-12 bg-[var(--muted-bg)] text-[var(--foreground)] rounded-xl font-semibold text-[15px] hover:bg-black/10 transition-colors press-effect"
          >
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className="flex-1 h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors press-effect"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Simpan Absensi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
