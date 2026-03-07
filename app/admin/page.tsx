'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, Clock, ChevronRight, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { getStoredUser, clearStoredUser, isAdmin } from '@/lib/auth';

interface Stats {
  totalEmployees: number;
  totalRecords: number;
  totalHM: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, totalRecords: 0, totalHM: 0 });
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdmin(user)) {
      router.push('/');
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [employeesRes, recordsRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/records?all=true'),
      ]);

      const employees = await employeesRes.json();
      const records = await recordsRes.json();

      const totalHM = Array.isArray(records)
        ? records.reduce((sum: number, r: { totalHM: number }) => sum + r.totalHM, 0)
        : 0;

      setStats({
        totalEmployees: Array.isArray(employees) ? employees.length : 0,
        totalRecords: Array.isArray(records) ? records.length : 0,
        totalHM,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    router.push('/login');
  };

  const handleReset = async () => {
    if (!resetPin) return;

    setResetting(true);
    setResetError('');

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: resetPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.error || 'Gagal mereset database');
        return;
      }

      setShowResetModal(false);
      setResetPin('');
      fetchStats();
    } catch {
      setResetError('Terjadi kesalahan');
    } finally {
      setResetting(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetPin('');
    setResetError('');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">Admin Panel</h1>
            <p className="text-[13px] text-[var(--muted)]">Kelola karyawan & data</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
            aria-label="Keluar"
          >
            <LogOut className="w-[18px] h-[18px] text-[var(--muted)]" />
          </button>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 flex-1">
        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">
              {loading ? '–' : stats.totalEmployees}
            </p>
            <p className="text-[13px] text-[var(--muted)] mt-1">Karyawan</p>
          </div>

          <div className="card p-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">
              {loading ? '–' : stats.totalRecords}
            </p>
            <p className="text-[13px] text-[var(--muted)] mt-1">Total Record</p>
          </div>
        </section>

        {/* Total HM Card */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] text-[var(--muted)] font-medium">Total Jam Kerja</p>
            <div className="w-10 h-10 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[var(--success)]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] font-bold tracking-tight text-[var(--foreground)] leading-none">
              {loading ? '–' : stats.totalHM.toFixed(1)}
            </span>
            <span className="text-[17px] text-[var(--muted)] font-medium">jam</span>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Menu Admin</h3>
          </div>

          <Link
            href="/admin/employees"
            className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors press-effect"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--foreground)]">Kelola Karyawan</p>
                <p className="text-[13px] text-[var(--muted)]">Tambah, edit, hapus karyawan</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
          </Link>

          <Link
            href="/admin/records"
            className="flex items-center justify-between px-5 py-4 border-t border-black/5 hover:bg-black/[0.02] transition-colors press-effect"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--foreground)]">Semua Record</p>
                <p className="text-[13px] text-[var(--muted)]">Lihat record semua karyawan</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
          </Link>
        </section>

        {/* Danger Zone */}
        <section className="card overflow-hidden border-[var(--error)]/20">
          <div className="px-5 py-4 border-b border-black/5 bg-[var(--error)]/5">
            <h3 className="text-[15px] font-semibold text-[var(--error)]">Danger Zone</h3>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--error)]/5 transition-colors press-effect"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--error)]/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[var(--error)]" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-medium text-[var(--foreground)]">Reset Database</p>
                <p className="text-[13px] text-[var(--muted)]">Hapus semua data & file</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </section>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--foreground)]">Reset Database</h2>
                <p className="text-[13px] text-[var(--muted)]">Aksi ini tidak bisa dibatalkan</p>
              </div>
            </div>

            <div className="bg-[var(--error)]/10 rounded-xl p-4 mb-4">
              <p className="text-[14px] text-[var(--error)] font-medium">
                Semua data berikut akan dihapus permanen:
              </p>
              <ul className="text-[13px] text-[var(--error)]/80 mt-2 space-y-1">
                <li>• Semua data karyawan</li>
                <li>• Semua record HM</li>
                <li>• Semua file foto timesheet</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                Masukkan PIN Admin untuk konfirmasi
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))}
                placeholder="•••••"
                className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[15px] text-center tracking-[0.3em] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--error)] transition-shadow"
              />
            </div>

            {resetError && (
              <div className="p-3 bg-[var(--error)]/10 rounded-xl mb-4">
                <p className="text-[14px] font-medium text-[var(--error)]">{resetError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeResetModal}
                className="flex-1 h-12 bg-[var(--muted-bg)] text-[var(--foreground)] rounded-xl font-medium text-[15px] hover:bg-black/10 transition-colors press-effect"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || resetPin.length < 5}
                className="flex-1 h-12 bg-[var(--error)] text-white rounded-xl font-medium text-[15px] hover:bg-[var(--error)]/90 disabled:opacity-50 transition-colors press-effect"
              >
                {resetting ? 'Menghapus...' : 'Reset Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
