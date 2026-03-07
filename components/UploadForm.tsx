'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, ImagePlus, X, Check } from 'lucide-react';
import Image from 'next/image';
import { getStoredUser } from '@/lib/auth';

interface UploadFormProps {
  onSuccess?: () => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
      setSuccess(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setTotalHM('');
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile || !totalHM) return;

    setIsProcessing(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('file', selectedFile);
      submitData.append('tanggal', tanggal);
      submitData.append('totalHM', totalHM);
      if (employeeId) {
        submitData.append('employeeId', employeeId);
      }

      const response = await fetch('/api/records', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan data');
      }

      setSuccess(true);
      setTimeout(() => {
        clearSelection();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
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
            className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all press-effect group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/15 transition-colors">
                <Camera className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-[var(--foreground)]">Ambil Foto</p>
                <p className="text-[13px] text-[var(--muted)]">Buka kamera untuk foto baru</p>
              </div>
            </div>
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all press-effect group"
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
        </div>
      ) : (
        <div className="space-y-4">
          {/* Photo Preview */}
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
          </div>

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
