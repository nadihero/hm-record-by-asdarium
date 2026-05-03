'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from "@/components/BottomNav";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { getStoredUser } from '@/lib/auth';

interface AbsensiRecord {
  id: string;
  tanggal: string;
  jamMasuk: string | null;
  jamPulang: string | null;
  status: string;
  shift: string | null;
  keterangan: string | null;
}

interface DayPopup {
  date: string;
  existing: AbsensiRecord | null;
}

type StatusType = 'hadir' | 'izin' | 'alpa' | 'sakit' | 'off';

const STATUS_CONFIG: Record<StatusType, { label: string; bg: string; text: string; dot: string }> = {
  hadir: { label: 'Hadir', bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  izin: { label: 'Izin', bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  alpa: { label: 'Alpa', bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
  sakit: { label: 'Sakit', bg: '#ffedd5', text: '#ea580c', dot: '#f97316' },
  off: { label: 'OFF', bg: '#fce7f3', text: '#9d174d', dot: '#db2777' },
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AbsensiPage() {
  const router = useRouter();
  const today = toLocalDateString(new Date());

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [popup, setPopup] = useState<DayPopup | null>(null);
  const [popupStatus, setPopupStatus] = useState<StatusType>('hadir');
  const [popupJamMasuk, setPopupJamMasuk] = useState('08:00');
  const [popupJamPulang, setPopupJamPulang] = useState('17:00');
  const [popupShift, setPopupShift] = useState<'D' | 'N' | 'D7' | 'N7' | null>(null);
  const [popupKeterangan, setPopupKeterangan] = useState('');
  const [popupError, setPopupError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push('/login'); return; }
    if (user.role === 'admin') { router.push('/admin'); return; }
    setEmployeeId(user.id);
  }, [router]);

  // Period: 19th of prev month → 18th of currentMonth/currentYear
  const getPeriodRange = useCallback(() => {
    const endDate = new Date(currentYear, currentMonth, 18);
    const startDate = new Date(currentYear, currentMonth - 1, 19);
    return { startDate, endDate };
  }, [currentYear, currentMonth]);

  const fetchRecords = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const { startDate, endDate } = getPeriodRange();
    const startStr = toLocalDateString(startDate);
    const endStr = toLocalDateString(endDate);
    try {
      const res = await fetch(`/api/absensi?start=${startStr}&end=${endStr}&employeeId=${employeeId}`);
      if (res.ok) setRecords(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [employeeId, getPeriodRange]);

  useEffect(() => {
    if (employeeId) fetchRecords();
  }, [fetchRecords]);

  // Build period date cells: array of YYYY-MM-DD strings from 19th prev → 18th current
  const { startDate, endDate } = getPeriodRange();
  const periodDates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    periodDates.push(toLocalDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  // Pad front so first date aligns to correct weekday column
  const firstDayOfWeek = new Date(startDate).getDay();
  const calendarCells: (string | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...periodDates,
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const recordMap = new Map<string, AbsensiRecord>();
  records.forEach(r => {
    recordMap.set(toLocalDateString(new Date(r.tanggal)), r);
  });

  const getPeriodLabel = () => {
    const start = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const end = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} – ${end}`;
  };

  const prevPeriod = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextPeriod = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const openPopup = (dateStr: string) => {
    const existing = recordMap.get(dateStr) ?? null;
    setPopup({ date: dateStr, existing });
    setPopupStatus((existing?.status as StatusType) ?? 'hadir');
    setPopupShift((existing?.shift as 'D' | 'N' | 'D7' | 'N7' | null) ?? 'D');
    setPopupJamMasuk(existing?.jamMasuk ?? '08:00');
    setPopupJamPulang(existing?.jamPulang ?? '17:00');
    setPopupKeterangan(existing?.keterangan ?? '');
    setPopupError('');
  };


  const closePopup = () => setPopup(null);

  const handleSave = async () => {
    if (!popup || !employeeId) return;
    if (popupStatus === 'hadir' && (!popupJamMasuk || !popupJamPulang)) {
      setPopupError('Jam masuk & pulang wajib diisi'); return;
    }
    if (popupStatus === 'hadir' && popupJamPulang <= popupJamMasuk) {
      setPopupError('Jam pulang harus setelah jam masuk'); return;
    }
    if ((popupStatus === 'sakit' || popupStatus === 'izin') && !popupKeterangan.trim()) {
      setPopupError('Keterangan wajib diisi'); return;
    }
    setSaving(true);
    setPopupError('');
    try {
      const body = {
        employeeId,
        tanggal: popup.date,
        jamMasuk: popupStatus === 'hadir' ? popupJamMasuk : null,
        jamPulang: popupStatus === 'hadir' ? popupJamPulang : null,
        status: popupStatus,
        shift: popupStatus === 'hadir' ? popupShift : null,
        keterangan: popupKeterangan.trim() || null,
      };
      const url = popup.existing ? `/api/absensi/${popup.existing.id}` : '/api/absensi';
      const method = popup.existing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setPopupError(d.error ?? 'Gagal menyimpan'); return;
      }
      closePopup();
      fetchRecords();
    } catch {
      setPopupError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!popup?.existing) return;
    setSaving(true);
    try {
      await fetch(`/api/absensi/${popup.existing.id}`, { method: 'DELETE' });
      closePopup();
      fetchRecords();
    } catch {
      setPopupError('Gagal menghapus');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    hadir: records.filter(r => r.status === 'hadir').length,
    izin: records.filter(r => r.status === 'izin').length,
    alpa: records.filter(r => r.status === 'alpa').length,
    sakit: records.filter(r => r.status === 'sakit').length,
    off: records.filter(r => r.status === 'off').length,
  };
  const presentase = records.length > 0 ? Math.round((stats.hadir / records.length) * 100) : 0;

  const formatPopupDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[var(--bg)]">
      <div className="px-2 pt-5 pb-5 space-y-3 flex-1">

        {/* Calendar Card */}
        <section className="rounded-3xl overflow-hidden shadow-sm" style={{ background: 'var(--card-bg, white)' }}>

          {/* Period Nav — gradient strip */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' }}>
            <button type="button" onClick={prevPeriod}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors press-effect">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-white leading-tight">{getPeriodLabel()}</p>
              <p className="text-[10px] text-white/70 mt-0.5">Periode Kerja</p>
            </div>
            <button type="button" onClick={nextPeriod}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors press-effect">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-1 pt-3 pb-0">
            {DAYS.map((d, i) => (
              <div key={d} className="text-center pb-2">
                <span className={`text-[12px] font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--muted)]'
                  }`}>{d}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 px-1 pb-2">
              {calendarCells.map((dateStr, idx) => {
                if (!dateStr) return <div key={`e-${idx}`} className="min-h-[44px]" />;
                const record = recordMap.get(dateStr);
                const isToday = dateStr === today;
                const cfg = record ? STATUS_CONFIG[record.status as StatusType] : null;
                const dayNum = parseInt(dateStr.split('-')[2]);
                const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => openPopup(dateStr)}
                    className="relative flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-all active:scale-90 press-effect mx-0.5 my-0.5"
                    style={{
                      backgroundColor: cfg ? cfg.bg : isToday ? 'var(--primary)' : 'transparent',
                      boxShadow: isToday && !cfg ? '0 2px 10px var(--primary)55' : undefined,
                    }}
                  >
                    <span
                      className="text-[15px] font-bold leading-none"
                      style={{
                        color: cfg ? cfg.text : isToday ? '#fff' : dayOfWeek === 0 ? '#f87171' : dayOfWeek === 6 ? '#60a5fa' : 'var(--foreground)',
                      }}
                    >
                      {dayNum}
                    </span>
                    {cfg ? (
                      <div className="flex items-center gap-0.5 mt-1">
                        {record?.shift ? (
                          <span
                            className="text-[9px] font-black px-1 py-0.5 rounded leading-none"
                            style={{
                              backgroundColor: record.shift.startsWith('N') ? '#1e1b4b' : '#fef9c3',
                              color: record.shift.startsWith('N') ? '#a5b4fc' : '#854d0e',
                            }}
                          >
                            {record.shift}
                          </span>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        )}
                      </div>
                    ) : isToday ? (
                      <div className="w-1.5 h-1.5 rounded-full mt-1 bg-white/60" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend strip */}
          <div className="flex items-center justify-center gap-4 pb-3 pt-1 border-t border-black/5 flex-wrap">
            {(Object.keys(STATUS_CONFIG) as StatusType[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[s].dot }} />
                <span className="text-[11px] font-medium text-[var(--muted)]">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Card */}
        <section className="rounded-3xl overflow-hidden shadow-sm" style={{ background: 'var(--card-bg, white)' }}>
          {/* Top: big % + label */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">Rekap Kehadiran</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-[44px] font-black leading-none" style={{ color: STATUS_CONFIG.hadir.text }}>
                  {loading ? '–' : presentase}
                </span>
                <span className="text-[20px] font-bold text-[var(--muted)] mb-1">%</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">{getPeriodLabel()}</p>
            </div>
            {/* Circular progress */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f0fdf4" strokeWidth="8" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={STATUS_CONFIG.hadir.dot}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - (loading ? 0 : presentase) / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-black" style={{ color: STATUS_CONFIG.hadir.text }}>
                  {loading ? '–' : `${presentase}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-5 gap-2 px-4 pb-5">
            {(Object.keys(STATUS_CONFIG) as StatusType[]).map(s => (
              <div key={s} className="flex flex-col items-center py-2.5 rounded-2xl"
                style={{ backgroundColor: STATUS_CONFIG[s].bg }}>
                <span className="text-[18px] font-black leading-none" style={{ color: STATUS_CONFIG[s].text }}>
                  {loading ? '–' : stats[s]}
                </span>
                <span className="text-[10px] font-semibold mt-1" style={{ color: STATUS_CONFIG[s].text }}>
                  {STATUS_CONFIG[s].label}
                </span>
              </div>
            ))}
          </div>
        </section>



      </div>

      {/* Popup Modal */}
      {popup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) closePopup(); }}
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-slide-up">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-[var(--muted)]">Tandai Kehadiran</p>
                <p className="text-[15px] font-semibold text-[var(--foreground)] mt-0.5">
                  {formatPopupDate(popup.date)}
                </p>
                {popup.existing && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[12px] font-semibold"
                    style={{
                      backgroundColor: STATUS_CONFIG[popup.existing.status as StatusType]?.bg,
                      color: STATUS_CONFIG[popup.existing.status as StatusType]?.text,
                    }}>
                    Sudah: {STATUS_CONFIG[popup.existing.status as StatusType]?.label}
                  </span>
                )}
              </div>
              <button type="button" onClick={closePopup}
                className="w-9 h-9 rounded-full bg-[var(--muted-bg)] flex items-center justify-center hover:bg-black/10 transition-colors press-effect">
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            {/* Status Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(STATUS_CONFIG) as StatusType[]).map(s => (
                <button key={s} type="button" onClick={() => setPopupStatus(s)}
                  className="py-3 rounded-xl text-[13px] font-semibold transition-all press-effect"
                  style={{
                    backgroundColor: popupStatus === s ? STATUS_CONFIG[s].dot : STATUS_CONFIG[s].bg,
                    color: popupStatus === s ? '#fff' : STATUS_CONFIG[s].text,
                  }}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>

            {/* Shift + Time – Hadir only */}
            {popupStatus === 'hadir' && (
              <div className="space-y-3">
                {/* Shift toggle */}
                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">Shift</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'D', emoji: '☀️', label: 'Siang', isNight: false },
                      { key: 'N', emoji: '🌙', label: 'Malam', isNight: true },
                      { key: 'D7', emoji: '☀️', label: 'Siang 7', isNight: false },
                      { key: 'N7', emoji: '🌙', label: 'Malam 7', isNight: true },
                    ] as const).map(({ key, emoji, label, isNight }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPopupShift(key)}
                        className="h-11 rounded-xl text-[13px] font-bold transition-all press-effect flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: popupShift === key
                            ? (isNight ? '#1e1b4b' : '#fef08a')
                            : (isNight ? '#eef2ff' : '#fefce8'),
                          color: popupShift === key
                            ? (isNight ? '#a5b4fc' : '#854d0e')
                            : (isNight ? '#6366f1' : '#ca8a04'),
                          border: popupShift === key ? 'none' : '1.5px solid transparent',
                          outline: popupShift === key ? `2px solid ${isNight ? '#6366f1' : '#ca8a04'}` : 'none',
                          outlineOffset: '1px',
                        }}
                      >
                        <span className="text-[14px]">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                      Jam Masuk <span className="text-[var(--error)]">*</span>
                    </label>
                    <input type="time" value={popupJamMasuk} onChange={e => setPopupJamMasuk(e.target.value)}
                      className="w-full h-11 px-3 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                      Jam Pulang <span className="text-[var(--error)]">*</span>
                    </label>
                    <input type="time" value={popupJamPulang} onChange={e => setPopupJamPulang(e.target.value)}
                      className="w-full h-11 px-3 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow" />
                  </div>
                </div>
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                Keterangan
                {(popupStatus === 'sakit' || popupStatus === 'izin') && <span className="text-[var(--error)]"> *</span>}
              </label>
              <input type="text" value={popupKeterangan} onChange={e => setPopupKeterangan(e.target.value)}
                placeholder={popupStatus === 'sakit' ? 'Contoh: Demam, flu...' : popupStatus === 'izin' ? 'Alasan izin...' : 'Opsional...'}
                className="w-full h-11 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow" />
            </div>

            {/* Error */}
            {popupError && (
              <p className="text-[13px] font-medium text-[var(--error)] bg-[var(--error)]/10 px-4 py-2.5 rounded-xl">
                {popupError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {popup.existing && (
                <button type="button" onClick={handleDelete} disabled={saving}
                  className="h-12 px-5 bg-[var(--error)]/10 text-[var(--error)] rounded-xl font-semibold text-[14px] hover:bg-[var(--error)]/20 disabled:opacity-50 transition-colors press-effect">
                  Hapus
                </button>
              )}
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 h-12 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors press-effect"
                style={{ backgroundColor: STATUS_CONFIG[popupStatus].dot }}>
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" />Simpan</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
