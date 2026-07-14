'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, ImagePlus, X, Check, FileText } from 'lucide-react';
import Image from 'next/image';
import { getStoredUser } from '@/lib/auth';
import { toLocalDateString } from '@/lib/utils';
import {
  fetchWithRetry,
  formatFileSize,
  prepareImageForUpload,
} from '@/lib/image';

interface UploadFormProps {
  onSuccess?: () => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(() => toLocalDateString());
  const [totalHM, setTotalHM] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === 'employee') {
      setEmployeeId(user.id);
    }
  }, []);

  const revokePreview = (url: string | null) => {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setStatusText('Mengompres gambar…');

    try {
      const prepared = await prepareImageForUpload(file);
      revokePreview(preview);
      setSelectedFile(prepared);
      setPreview(URL.createObjectURL(prepared));
      setIsManualMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses gambar');
      setSelectedFile(null);
      revokePreview(preview);
      setPreview(null);
    } finally {
      setStatusText(null);
      e.target.value = '';
    }
  };

  const clearSelection = () => {
    revokePreview(preview);
    setSelectedFile(null);
    setPreview(null);
    setIsManualMode(false);
    setTanggal(toLocalDateString());
    setTotalHM('');
    setError(null);
    setSuccess(false);
    setStatusText(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleManualMode = () => {
    setIsManualMode(true);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!totalHM) return;
    if (!isManualMode && !selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setStatusText(selectedFile ? 'Mengunggah…' : 'Menyimpan…');

    try {
      const submitData = new FormData();
      if (selectedFile) {
        submitData.append('file', selectedFile);
      }
      submitData.append('tanggal', tanggal);
      submitData.append('totalHM', totalHM);
      if (employeeId) {
        submitData.append('employeeId', employeeId);
      }

      const response = await fetchWithRetry(
        '/api/records',
        { method: 'POST', body: submitData },
        {
          maxAttempts: 4,
          onRetry: ({ attempt, maxAttempts }) => {
            setStatusText(
              `Jaringan lambat, mencoba lagi (${attempt}/${maxAttempts - 1})…`
            );
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSuccess(true);
      setStatusText(null);
      setTimeout(() => {
        clearSelection();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload gagal. Periksa koneksi lalu coba lagi.'
      );
      setStatusText(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!preview && !isManualMode ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!statusText}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all press-effect group disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/15 transition-colors">
                <Camera className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-[var(--foreground)]">Ambil Foto</p>
                <p className="text-[13px] text-[var(--muted)]">Otomatis dikompres (maks. 5 MB)</p>
              </div>
            </div>
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={!!statusText}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all press-effect group disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/15 transition-colors">
                <ImagePlus className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-[var(--foreground)]">Pilih dari Galeri</p>
                <p className="text-[13px] text-[var(--muted)]">Upload foto yang sudah ada</p>
              </div>
            </div>
          </button>

          {/* Manual Input Button */}
          <button
            type="button"
            onClick={handleManualMode}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--success)]/50 hover:bg-[var(--success)]/5 transition-all press-effect group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--success)]/10 flex items-center justify-center group-hover:bg-[var(--success)]/15 transition-colors">
                <FileText className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-[var(--foreground)]">Input Manual</p>
                <p className="text-[13px] text-[var(--muted)]">Tambah record tanpa foto</p>
              </div>
            </div>
          </button>

          {statusText && (
            <div className="flex items-center gap-3 p-4 bg-[var(--primary)]/10 rounded-xl">
              <div className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="text-[14px] font-medium text-[var(--primary)]">{statusText}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Photo Preview - only show if there's a preview */}
          {preview && (
            <div className="relative rounded-2xl overflow-hidden bg-black/5">
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={300}
                className="w-full h-auto object-cover"
              />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors press-effect"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedFile && (
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 text-white text-[11px] font-medium">
                  {formatFileSize(selectedFile.size)}
                </span>
              )}
            </div>
          )}

          {/* Manual Mode Header */}
          {isManualMode && !preview && (
            <div className="flex items-center justify-between p-4 bg-[var(--success)]/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--foreground)]">Input Manual</p>
                  <p className="text-[13px] text-[var(--muted)]">Tanpa foto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="w-8 h-8 bg-black/10 text-[var(--muted)] rounded-full flex items-center justify-center hover:bg-black/20 transition-colors press-effect"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form */}
          {!success && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">Total Jam (HM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalHM}
                    onChange={(e) => setTotalHM(e.target.value)}
                    placeholder="0.0"
                    className="w-full h-14 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[24px] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                  />
                </div>

                {totalHM && parseFloat(totalHM) > 0 && (
                  <div className="bg-[var(--primary)]/10 p-4 rounded-xl text-center">
                    <p className="text-[13px] text-[var(--muted)] mb-1">Total HM</p>
                    <p className="text-[32px] font-bold text-[var(--primary)] leading-none">
                      {parseFloat(totalHM).toFixed(1)}
                    </p>
                    <p className="text-[13px] text-[var(--muted)] mt-1">jam</p>
                  </div>
                )}
              </div>

              {statusText && isProcessing && (
                <div className="flex items-center gap-3 p-3 bg-[var(--primary)]/10 rounded-xl">
                  <div className="w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                  <p className="text-[13px] font-medium text-[var(--primary)]">{statusText}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || !tanggal || !totalHM}
                className="w-full h-12 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all press-effect"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan Record
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-14 h-14 rounded-full bg-[var(--success)]/10 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-[var(--success)]" />
              </div>
              <p className="text-[15px] font-semibold text-[var(--foreground)]">Berhasil disimpan!</p>
              <p className="text-[13px] text-[var(--muted)] mt-1">Record telah ditambahkan</p>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[var(--error)]/10 rounded-xl">
          <p className="text-[14px] font-medium text-[var(--error)]">{error}</p>
        </div>
      )}
    </div>
  );
}
