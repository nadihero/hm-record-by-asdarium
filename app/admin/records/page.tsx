'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, X, User } from 'lucide-react';
import { getStoredUser, isAdmin } from '@/lib/auth';
import { formatDateMedium } from '@/lib/utils';
import { resolveFotoUrl } from '@/lib/foto-url';

interface HMRecord {
  id: string;
  tanggal: string;
  totalHM: number;
  fotoPath: string;
  employee?: {
    id: string;
    nama: string;
  };
}

export default function AdminRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<HMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdmin(user)) {
      router.push('/');
      return;
    }
    fetchRecords();
  }, [router]);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records?all=true');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHM = records.reduce((sum, r) => sum + r.totalHM, 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            href="/admin"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
          </Link>
          <h1 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">Semua Record</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4 flex-1">
        {/* Summary */}
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[var(--muted)]">Total Semua Record</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[28px] font-bold text-[var(--foreground)]">
                  {loading ? '–' : totalHM.toFixed(1)}
                </span>
                <span className="text-[15px] text-[var(--muted)]">jam</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-[var(--muted)]">Jumlah</p>
              <p className="text-[17px] font-semibold text-[var(--foreground)] mt-1">
                {loading ? '–' : records.length} record
              </p>
            </div>
          </div>
        </section>

        {/* Records List */}
        <section className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length > 0 ? (
            <div className="divide-y divide-black/5">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const src = resolveFotoUrl(record.fotoPath);
                      if (src) setSelectedImage(src);
                    }}
                    className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--muted-bg)] flex-shrink-0 press-effect"
                  >
                    {record.fotoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveFotoUrl(record.fotoPath)}
                        alt="Timesheet"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[var(--muted)]" />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[var(--foreground)]">
                      {formatDateMedium(record.tanggal)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-[var(--muted)]" />
                      <p className="text-[13px] text-[var(--muted)] truncate">
                        {record.employee?.nama || 'Tidak diketahui'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[17px] font-semibold text-[var(--primary)]">{record.totalHM}</p>
                    <p className="text-[11px] text-[var(--muted)]">jam</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--muted-bg)] flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <p className="text-[15px] font-medium text-[var(--foreground)]">Belum ada record</p>
              <p className="text-[13px] text-[var(--muted)] mt-1">Tidak ada data</p>
            </div>
          )}
        </section>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
    </div>
  );
}
