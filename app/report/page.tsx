'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from "@/components/BottomNav";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X, Clock } from "lucide-react";
import Image from 'next/image';
import { getStoredUser } from '@/lib/auth';

interface HMRecord {
  id: string;
  tanggal: string;
  totalHM: number;
  fotoPath: string;
}

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<HMRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const getPeriodRange = () => {
    const startDate = new Date(currentYear, currentMonth - 1, 19);
    const endDate = new Date(currentYear, currentMonth, 18);
    return { startDate, endDate };
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getPeriodRange();
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

  useEffect(() => {
    if (employeeId) {
      fetchRecords();
    }
  }, [currentYear, currentMonth, employeeId]);

  const fetchRecords = async () => {
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
  };

  const totalHM = records.reduce((sum, r) => sum + r.totalHM, 0);
  const totalRecords = records.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };


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
          <div className="flex items-center gap-2 px-5 py-4 border-b border-black/5">
            <ImageIcon className="w-4 h-4 text-[var(--muted)]" />
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Foto Timesheet</h3>
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
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[.02] active:bg-black/5 transition-colors press-effect text-left"
                  onClick={() => record.fotoPath && setSelectedImage(record.fotoPath)}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--muted-bg)]">
                    {record.fotoPath ? (
                      <Image
                        src={record.fotoPath}
                        alt={`Timesheet ${formatDate(record.tanggal)}`}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
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
                      {new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[12px] text-[var(--muted)] mt-0.5">
                      {new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric' })}
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
          <Image
            src={selectedImage}
            alt="Preview"
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
