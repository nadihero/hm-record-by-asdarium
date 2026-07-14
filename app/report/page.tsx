'use client';

import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from "@/components/BottomNav";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X, Clock, Pencil, Trash2, Check, Camera, ImagePlus } from "lucide-react";
import { getStoredUser } from '@/lib/auth';
import {
  formatDateDayMonth,
  formatDateLong,
  formatDateYear,
  formatWorkPeriodLabel,
  getActiveWorkPeriod,
  getWorkPeriodByEndMonth,
  toDateOnlyString,
  toLocalDateString,
} from '@/lib/utils';
import { resolveFotoUrl } from '@/lib/foto-url';
import { fetchWithRetry, prepareImageForUpload } from '@/lib/image';

interface HMRecord {
  id: string;
  tanggal: string;
  totalHM: number;
  fotoPath: string;
}

const LONG_PRESS_MS = 500;

export default function ReportPage() {
  const router = useRouter();
  // Default to active work period (19→18), same as timesheet
  const activePeriod = getActiveWorkPeriod();
  const [currentYear, setCurrentYear] = useState(activePeriod.endDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(activePeriod.endDate.getMonth());
  const [records, setRecords] = useState<HMRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Long-press edit popup
  const [editRecord, setEditRecord] = useState<HMRecord | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editTotalHM, setEditTotalHM] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [removeFoto, setRemoveFoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const getPeriodRange = useCallback(() => {
    return getWorkPeriodByEndMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const getPeriodLabel = () => {
    const { startDate, endDate } = getPeriodRange();
    return formatWorkPeriodLabel(startDate, endDate);
  };

  const prevPeriod = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextPeriod = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    setEmployeeId(user.id);
  }, [router]);

  const fetchRecords = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodRange();
      const startStr = toLocalDateString(startDate);
      const endStr = toLocalDateString(endDate);
      const response = await fetch(`/api/records?start=${startStr}&end=${endStr}&employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId, getPeriodRange]);

  useEffect(() => {
    if (employeeId) {
      fetchRecords();
    }
  }, [employeeId, fetchRecords]);

  const revokePreview = (url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const openEditPopup = (record: HMRecord) => {
    revokePreview(editPreview);
    setEditRecord(record);
    setEditTanggal(toDateOnlyString(record.tanggal));
    setEditTotalHM(String(record.totalHM));
    setEditError('');
    setConfirmDelete(false);
    setEditFile(null);
    setEditPreview(null);
    setRemoveFoto(false);
  };

  const closeEditPopup = () => {
    revokePreview(editPreview);
    setEditRecord(null);
    setEditError('');
    setConfirmDelete(false);
    setSaving(false);
    setEditFile(null);
    setEditPreview(null);
    setRemoveFoto(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleFotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError('');
    setUploadStatus('Mengompres gambar…');
    try {
      const prepared = await prepareImageForUpload(file);
      revokePreview(editPreview);
      setEditFile(prepared);
      setEditPreview(URL.createObjectURL(prepared));
      setRemoveFoto(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal memproses gambar');
    } finally {
      setUploadStatus(null);
      e.target.value = '';
    }
  };

  const clearSelectedFoto = () => {
    revokePreview(editPreview);
    setEditFile(null);
    setEditPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleRemoveFoto = () => {
    clearSelectedFoto();
    setRemoveFoto(true);
  };

  const currentFotoSrc = editPreview
    || (!removeFoto && editRecord?.fotoPath ? resolveFotoUrl(editRecord.fotoPath) : null);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (record: HMRecord) => {
    longPressFired.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      // Haptic feedback when available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
      openEditPopup(record);
    }, LONG_PRESS_MS);
  };

  const handleRecordClick = (record: HMRecord) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    const src = resolveFotoUrl(record.fotoPath);
    if (src) {
      setSelectedImage(src);
    }
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    const hm = parseFloat(editTotalHM);
    if (!editTanggal) {
      setEditError('Tanggal wajib diisi');
      return;
    }
    if (isNaN(hm) || hm < 0) {
      setEditError('Total HM tidak valid');
      return;
    }

    setSaving(true);
    setEditError('');
    setUploadStatus(editFile ? 'Mengunggah…' : null);
    try {
      const formData = new FormData();
      formData.append('tanggal', editTanggal);
      formData.append('totalHM', String(hm));
      if (editFile) {
        formData.append('file', editFile);
      } else if (removeFoto) {
        formData.append('removeFoto', 'true');
      }

      const res = await fetchWithRetry(
        `/api/records/${editRecord.id}`,
        { method: 'PUT', body: formData },
        {
          maxAttempts: 4,
          onRetry: ({ attempt, maxAttempts }) => {
            setUploadStatus(`Jaringan lambat, coba lagi ${attempt}/${maxAttempts - 1}…`);
          },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan');
      }
      closeEditPopup();
      fetchRecords();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
      setUploadStatus(null);
    }
  };

  const handleDelete = async () => {
    if (!editRecord) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/records/${editRecord.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menghapus');
      }
      closeEditPopup();
      fetchRecords();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  const totalHM = records.reduce((sum, r) => sum + r.totalHM, 0);
  const totalRecords = records.length;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 pt-5 pb-5 space-y-4 flex-1">
        {/* Period Navigator */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button type="button" onClick={prevPeriod}
              className="w-9 h-9 rounded-full bg-[var(--muted-bg)] flex items-center justify-center hover:bg-black/10 transition-colors press-effect">
              <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
            </button>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-[var(--foreground)]">{getPeriodLabel()}</p>
              <p className="text-[11px] text-[var(--muted)]">Periode Kerja</p>
            </div>
            <button type="button" onClick={nextPeriod}
              className="w-9 h-9 rounded-full bg-[var(--muted-bg)] flex items-center justify-center hover:bg-black/10 transition-colors press-effect">
              <ChevronRight className="w-4 h-4 text-[var(--foreground)]" />
            </button>
          </div>
        </section>

        {/* Summary Card */}
        <section className="card p-6">
          <div className="text-center">
            <p className="text-[13px] text-[var(--muted)] font-medium">{getPeriodLabel()}</p>
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <span className="text-[48px] font-bold tracking-tight text-[var(--foreground)] leading-none">
                {loading ? '–' : totalHM.toFixed(1)}
              </span>
              <span className="text-[17px] text-[var(--muted)] font-medium">jam</span>
            </div>
            <p className="text-[13px] text-[var(--muted)] mt-2">
              {loading ? '...' : `${totalRecords} record`}
            </p>
          </div>
        </section>

        {/* Records List */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[var(--muted)]" />
              <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Foto Timesheet</h3>
            </div>
            <p className="text-[11px] text-[var(--muted)]">Tekan lama untuk edit</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : records.length > 0 ? (
            <div className="divide-y divide-black/5">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[.02] active:bg-black/5 transition-colors press-effect text-left select-none"
                  onClick={() => handleRecordClick(record)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openEditPopup(record);
                  }}
                  onTouchStart={() => startLongPress(record)}
                  onTouchEnd={clearLongPress}
                  onTouchMove={clearLongPress}
                  onTouchCancel={clearLongPress}
                  onMouseDown={() => startLongPress(record)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--muted-bg)]">
                    {record.fotoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveFotoUrl(record.fotoPath)}
                        alt={`Timesheet ${formatDateDayMonth(record.tanggal)}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[var(--muted)]" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--foreground)] leading-tight">
                      {formatDateLong(record.tanggal)}
                    </p>
                    <p className="text-[12px] text-[var(--muted)] mt-0.5">
                      {formatDateYear(record.tanggal)}
                    </p>
                  </div>
                  {/* HM Badge */}
                  <div className="flex-shrink-0 bg-[var(--primary)]/10 px-3 py-1.5 rounded-xl">
                    <p className="text-[15px] font-black text-[var(--primary)] leading-none">{record.totalHM}</p>
                    <p className="text-[10px] font-medium text-[var(--primary)]/70 text-center mt-0.5">jam</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--muted-bg)] flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <p className="text-[15px] font-medium text-[var(--foreground)]">Belum ada record</p>
              <p className="text-[13px] text-[var(--muted)] mt-1">Tidak ada data untuk periode ini</p>
            </div>
          )}
        </section>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors press-effect"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>
      )}

      {/* Edit / Delete Popup */}
      {editRecord && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditPopup(); }}
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--foreground)]">Edit Record</p>
                  <p className="text-[12px] text-[var(--muted)] mt-0.5">
                    {formatDateLong(editRecord.tanggal)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditPopup}
                className="w-9 h-9 rounded-full bg-[var(--muted-bg)] flex items-center justify-center hover:bg-black/10 transition-colors press-effect"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotoSelect}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoSelect}
            />

            {/* Foto section */}
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-[var(--muted)]">
                Foto Timesheet
              </label>

              {currentFotoSrc ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[var(--muted-bg)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentFotoSrc}
                    alt="Timesheet"
                    className="w-full h-full object-cover"
                  />
                  {editFile && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-[var(--primary)] text-white text-[11px] font-semibold">
                      Foto baru
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(currentFotoSrc)}
                      className="px-2.5 py-1.5 rounded-lg bg-black/50 text-white text-[11px] font-medium hover:bg-black/70 transition-colors"
                    >
                      Lihat
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--error)]/90 text-white text-[11px] font-medium hover:bg-[var(--error)] transition-colors"
                    >
                      Hapus foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl bg-[var(--muted-bg)] flex flex-col items-center justify-center gap-1">
                  <Clock className="w-6 h-6 text-[var(--muted)]" />
                  <p className="text-[12px] text-[var(--muted)]">
                    {removeFoto ? 'Foto akan dihapus' : 'Belum ada foto'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-11 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--primary)]/15 transition-colors press-effect"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-11 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent)]/15 transition-colors press-effect"
                >
                  <ImagePlus className="w-4 h-4" />
                  Galeri
                </button>
              </div>
              {editFile && (
                <button
                  type="button"
                  onClick={clearSelectedFoto}
                  className="w-full text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Batalkan foto baru
                </button>
              )}
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                  Total HM (jam)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editTotalHM}
                  onChange={(e) => setEditTotalHM(e.target.value)}
                  className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[16px] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                />
              </div>
            </div>

            {uploadStatus && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--primary)]/10 rounded-xl">
                <div className="w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="text-[13px] font-medium text-[var(--primary)]">{uploadStatus}</p>
              </div>
            )}

            {editError && (
              <p className="text-[13px] font-medium text-[var(--error)] bg-[var(--error)]/10 px-4 py-2.5 rounded-xl">
                {editError}
              </p>
            )}

            {confirmDelete && (
              <p className="text-[13px] font-medium text-[var(--error)] bg-[var(--error)]/10 px-4 py-2.5 rounded-xl">
                Tekan Hapus lagi untuk mengonfirmasi penghapusan.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className={`h-12 px-5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors press-effect ${
                  confirmDelete
                    ? 'bg-[var(--error)] text-white'
                    : 'bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors press-effect"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan
                  </>
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
