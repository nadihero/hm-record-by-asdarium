'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AbsensiForm from "@/components/AbsensiForm";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Coffee } from "lucide-react";
import { getStoredUser } from '@/lib/auth';

interface AbsensiRecord {
  id: string;
  tanggal: string;
  jamMasuk: string | null;
  jamPulang: string | null;
  status: string;
  keterangan: string | null;
}

const statusIcons = {
  hadir: CheckCircle,
  alpa: XCircle,
  sakit: AlertCircle,
  cuti: Coffee,
};

const statusColors = {
  hadir: 'var(--success)',
  alpa: 'var(--error)',
  sakit: 'var(--warning)',
  cuti: 'var(--primary)',
};

const statusLabels = {
  hadir: 'Hadir',
  alpa: 'Alpa',
  sakit: 'Sakit',
  cuti: 'Cuti',
};

export default function AbsensiPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      const response = await fetch(`/api/absensi?month=${selectedMonth}&employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching absensi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getMonthName = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Calculate stats
  const stats = {
    hadir: records.filter(r => r.status === 'hadir').length,
    alpa: records.filter(r => r.status === 'alpa').length,
    sakit: records.filter(r => r.status === 'sakit').length,
    cuti: records.filter(r => r.status === 'cuti').length,
  };

  const totalRecords = records.length;
  const presentaseHadir = totalRecords > 0 ? Math.round((stats.hadir / totalRecords) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Absensi" subtitle="Catat kehadiran harian" showBack />

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

        {/* Stats Summary */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] text-[var(--muted)] font-medium">{getMonthName()}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[32px] font-bold text-[var(--foreground)] leading-none">
                  {loading ? '–' : presentaseHadir}%
                </span>
                <span className="text-[14px] text-[var(--muted)]">kehadiran</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-[var(--success)]" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-xl bg-[var(--success)]/10">
              <p className="text-[18px] font-bold text-[var(--success)]">{stats.hadir}</p>
              <p className="text-[11px] text-[var(--muted)]">Hadir</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-[var(--error)]/10">
              <p className="text-[18px] font-bold text-[var(--error)]">{stats.alpa}</p>
              <p className="text-[11px] text-[var(--muted)]">Alpa</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-[var(--warning)]/10">
              <p className="text-[18px] font-bold text-[var(--warning)]">{stats.sakit}</p>
              <p className="text-[11px] text-[var(--muted)]">Sakit</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-[var(--primary)]/10">
              <p className="text-[18px] font-bold text-[var(--primary)]">{stats.cuti}</p>
              <p className="text-[11px] text-[var(--muted)]">Cuti</p>
            </div>
          </div>
        </section>

        {/* Add Button */}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full card card-interactive p-4 flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-semibold text-[var(--foreground)]">Input Absensi</p>
            <p className="text-[13px] text-[var(--muted)]">Catat kehadiran hari ini</p>
          </div>
        </button>

        {/* Records List */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-black/5">
            <Clock className="w-4 h-4 text-[var(--muted)]" />
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Riwayat Absensi</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : records.length > 0 ? (
            <div className="divide-y divide-black/5">
              {records.map((record) => {
                const StatusIcon = statusIcons[record.status as keyof typeof statusIcons] || CheckCircle;
                const statusColor = statusColors[record.status as keyof typeof statusColors] || 'var(--muted)';
                const statusLabel = statusLabels[record.status as keyof typeof statusLabels] || record.status;

                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)` }}
                    >
                      <StatusIcon className="w-5 h-5" style={{ color: statusColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-[var(--foreground)]">
                        {formatDate(record.tanggal)}
                      </p>
                      <p className="text-[13px] text-[var(--muted)]">
                        {record.status === 'hadir' && record.jamMasuk && record.jamPulang
                          ? `${record.jamMasuk} - ${record.jamPulang}`
                          : record.keterangan || statusLabel
                        }
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--muted-bg)] flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <p className="text-[15px] font-medium text-[var(--foreground)]">Belum ada absensi</p>
              <p className="text-[13px] text-[var(--muted)] mt-1">Tidak ada data untuk bulan ini</p>
            </div>
          )}
        </section>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-semibold text-[var(--foreground)]">Input Absensi</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-[var(--muted-bg)] flex items-center justify-center hover:bg-black/10 transition-colors press-effect"
              >
                <XCircle className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>
            <AbsensiForm
              onSuccess={() => {
                setShowForm(false);
                fetchRecords();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
