'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Calendar, Image as ImageIcon, X, Clock } from "lucide-react";
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<HMRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

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
  }, [selectedMonth, employeeId]);

  const fetchRecords = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/records?month=${selectedMonth}&employeeId=${employeeId}`);
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

  const getMonthName = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Laporan" subtitle="Rekap bulanan" showBack />

      <div className="px-4 py-5 space-y-4 flex-1">
        {/* Month Selector */}
        <section className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-[var(--muted)] mb-1">Pilih Bulan</p>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--muted-bg)] border-0 rounded-lg text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
              />
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <section className="card p-6">
          <div className="text-center">
            <p className="text-[13px] text-[var(--muted)] font-medium">{getMonthName()}</p>
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
            <div className="grid grid-cols-3 gap-1 p-1">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className="relative aspect-square rounded-xl overflow-hidden group press-effect"
                  onClick={() => record.fotoPath && setSelectedImage(record.fotoPath)}
                >
                  {record.fotoPath ? (
                    <Image
                      src={record.fotoPath}
                      alt={`Timesheet ${formatDate(record.tanggal)}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--muted-bg)] flex items-center justify-center">
                      <Clock className="w-8 h-8 text-[var(--muted)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-center">
                    <p className="text-[11px] font-medium">{formatDate(record.tanggal)}</p>
                    <p className="text-[13px] font-bold">{record.totalHM}h</p>
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
              <p className="text-[13px] text-[var(--muted)] mt-1">Tidak ada data untuk bulan ini</p>
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
