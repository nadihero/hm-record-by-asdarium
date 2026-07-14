'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { Camera, BarChart3, Clock, ChevronRight, FileText, LogOut } from "lucide-react";
import { getStoredUser, clearStoredUser, AuthUser } from '@/lib/auth';
import {
  formatDateMedium,
  formatWorkPeriodLabel,
  getActiveWorkPeriod,
  toLocalDateString,
} from '@/lib/utils';

interface HMRecord {
  id: string;
  tanggal: string;
  totalHM: number;
  fotoPath: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<HMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/login');
      return;
    }
    // Admin should go to admin dashboard
    if (storedUser.role === 'admin') {
      router.push('/admin');
      return;
    }
    setUser(storedUser);
    fetchRecords(storedUser.id);
  }, [router]);

  const fetchRecords = async (employeeId: string) => {
    try {
      const { startDate, endDate } = getActiveWorkPeriod();
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

  const getPeriodDisplay = () => {
    const { startDate, endDate } = getActiveWorkPeriod();
    return formatWorkPeriodLabel(startDate, endDate);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 pt-5 pb-5 space-y-5 flex-1">
        {/* Greeting Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[18px]  text-[var(--foreground)] leading-tight">{getGreeting()}</p>
            <p className="text-lg font-bold uppercase">{user?.nama || 'User'}</p>
          </div>
          <button
            onClick={() => { clearStoredUser(); router.push('/login'); }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
            aria-label="Keluar"
          >
            <LogOut className="w-[18px] h-[18px] text-[var(--muted)]" />
          </button>
        </div>
        {/* Primary Stat Card */}
        {loading ? (
          <section className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="skeleton h-3 w-20 rounded-md mb-2" />
                <div className="skeleton h-3 w-32 rounded-md" />
              </div>
              <div className="skeleton w-10 h-10 rounded-full" />
            </div>
            <div className="skeleton h-12 w-24 rounded-lg mb-2" />
            <div className="skeleton h-3 w-28 rounded-md" />
          </section>
        ) : (
          <section className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] text-[var(--muted)] font-medium">Periode Aktif</p>
                <p className="text-[13px] text-[var(--foreground)] font-medium mt-0.5">{getPeriodDisplay()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--primary)]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[48px] font-bold tracking-tight text-[var(--foreground)] leading-none">
                {totalHM.toFixed(1)}
              </span>
              <span className="text-[17px] text-[var(--muted)] font-medium">jam</span>
            </div>
            <p className="text-[13px] text-[var(--muted)] mt-2">
              {records.length} record tercatat
            </p>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/upload"
            className="card card-interactive p-5 flex flex-col gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/15 transition-colors">
              <Camera className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--foreground)]">Upload</p>
              <p className="text-[13px] text-[var(--muted)]">Tambah record</p>
            </div>
          </Link>

          <Link
            href="/report"
            className="card card-interactive p-5 flex flex-col gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/15 transition-colors">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--foreground)]">Laporan</p>
              <p className="text-[13px] text-[var(--muted)]">Rekap bulanan</p>
            </div>
          </Link>
        </section>

        {/* Recent Records */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Record Terbaru</h3>
            <Link href="/report" className="text-[13px] text-[var(--primary)] font-medium flex items-center gap-0.5 hover:opacity-70 transition-opacity press-effect">
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-black/5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="skeleton h-4 w-24 rounded-md" />
                  </div>
                  <div className="skeleton h-4 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : records.length > 0 ? (
            <div className="divide-y divide-black/5">
              {records.slice(0, 5).map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-black/[0.02] transition-colors press-effect animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--muted-bg)] flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[var(--muted)]" />
                    </div>
                    <span className="text-[15px] text-[var(--foreground)]">
                      {formatDateMedium(record.tanggal)}
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold text-[var(--primary)]">{record.totalHM} jam</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <p className="text-[17px] font-semibold text-[var(--foreground)] text-center">Belum ada record</p>
              <p className="text-[14px] text-[var(--muted)] mt-1 text-center max-w-[200px]">
                Upload timesheet pertama Anda untuk mulai mencatat jam kerja
              </p>
              <Link
                href="/upload"
                className="mt-5 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-[15px] flex items-center gap-2 transition-colors press-effect"
              >
                <Camera className="w-4 h-4" />
                Upload Sekarang
              </Link>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
