'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, User } from 'lucide-react';
import { getStoredUser, isAdmin } from '@/lib/auth';

interface Employee {
  id: string;
  nama: string;
  pin: string;
  createdAt: string;
  _count: {
    records: number;
  };
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ nama: '', pin: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdmin(user)) {
      router.push('/');
      return;
    }
    fetchEmployees();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingEmployee
        ? `/api/admin/employees/${editingEmployee.id}`
        : '/api/admin/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      setShowAddModal(false);
      setEditingEmployee(null);
      setFormData({ nama: '', pin: '' });
      fetchEmployees();
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus karyawan ini? Semua record-nya juga akan dihapus.')) return;

    try {
      await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({ nama: employee.nama, pin: '' });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    setFormData({ nama: '', pin: '' });
    setError('');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors press-effect"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
            </Link>
            <h1 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">Karyawan</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors press-effect"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-5 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="divide-y divide-black/5">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--muted-bg)] flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[var(--foreground)]">{employee.nama}</p>
                      <p className="text-[13px] text-[var(--muted)]">
                        PIN: {employee.pin} • {employee._count.records} record
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(employee)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--error)]/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--error)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--muted-bg)] flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-[var(--muted)]" />
            </div>
            <p className="text-[15px] font-medium text-[var(--foreground)]">Belum ada karyawan</p>
            <p className="text-[13px] text-[var(--muted)] mt-1">Tambah karyawan pertama</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-[14px] font-medium hover:bg-[var(--primary-hover)] transition-colors press-effect"
            >
              Tambah Karyawan
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <h2 className="text-[17px] font-semibold text-[var(--foreground)] mb-4">
              {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">Nama</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama karyawan"
                  className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                  PIN {editingEmployee && '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                  placeholder="5 digit angka"
                  className="w-full h-12 px-4 bg-[var(--muted-bg)] border-0 rounded-xl text-[15px] text-center tracking-[0.3em] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                  required={!editingEmployee}
                />
              </div>

              {error && (
                <div className="p-3 bg-[var(--error)]/10 rounded-xl">
                  <p className="text-[14px] font-medium text-[var(--error)]">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-12 bg-[var(--muted-bg)] text-[var(--foreground)] rounded-xl font-medium text-[15px] hover:bg-black/10 transition-colors press-effect"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 bg-[var(--primary)] text-white rounded-xl font-medium text-[15px] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors press-effect"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
