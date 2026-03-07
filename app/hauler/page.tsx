'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, RotateCw, Plus, Share2, Trash2, Clock } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HaulerCard from '@/components/HaulerCard';
import { AddHaulerModal, DeleteHaulerModal } from '@/components/HaulerModal';
import {
  Hauler,
  ActivityLog,
  loadHaulers,
  createHauler,
  deleteHauler,
  incrementRetase,
  decrementRetase,
  getStatistics,
  getRoutes,
  getActivityLog,
  clearActivityLog,
  shareToWhatsApp,
  isHaulerNameExists,
} from '@/lib/hauler';

export default function HaulerPage() {
  const [haulers, setHaulers] = useState<Hauler[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; hauler: Hauler | null }>({
    isOpen: false,
    hauler: null,
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const refreshData = useCallback(() => {
    setHaulers(loadHaulers());
    setActivityLog(getActivityLog());
    setRoutes(getRoutes());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddHauler = (data: { name: string; route: string; retase: number }) => {
    if (isHaulerNameExists(data.name)) {
      showNotification('Hauler dengan nama ini sudah ada', 'error');
      return;
    }
    createHauler(data);
    refreshData();
    showNotification(`${data.name} berhasil ditambahkan`);
  };

  const handleIncrement = (id: string) => {
    const hauler = incrementRetase(id);
    if (hauler) {
      refreshData();
      showNotification(`${hauler.name}: ${hauler.retase} retase`);
    }
  };

  const handleDecrement = (id: string) => {
    const hauler = decrementRetase(id);
    if (hauler) {
      refreshData();
      showNotification(`${hauler.name}: ${hauler.retase} retase`);
    }
  };

  const handleDeleteClick = (id: string) => {
    const hauler = haulers.find((h) => h.id === id);
    if (hauler) {
      setDeleteModal({ isOpen: true, hauler });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.hauler) {
      deleteHauler(deleteModal.hauler.id);
      refreshData();
      showNotification(`${deleteModal.hauler.name} berhasil dihapus`);
    }
  };

  const handleClearLog = () => {
    clearActivityLog();
    refreshData();
    showNotification('Activity log dibersihkan');
  };

  const handleShare = () => {
    shareToWhatsApp();
  };

  const stats = getStatistics();

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Hauler" subtitle="Manajemen Truck & Retase" />

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl text-[14px] font-medium z-[100] animate-fade-in shadow-lg ${
            notification.type === 'error'
              ? 'bg-[var(--error)] text-white'
              : 'bg-[var(--success)] text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="px-4 py-5 space-y-5 flex-1">
        {/* Statistics Cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-2">
              <Truck className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-[28px] font-bold text-[var(--foreground)]">{stats.totalHaulers}</p>
            <p className="text-[12px] text-[var(--muted)] font-medium">Total Hauler</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-2">
              <RotateCw className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-[28px] font-bold text-[var(--foreground)]">{stats.totalRetase}</p>
            <p className="text-[12px] text-[var(--muted)] font-medium">Total Retase</p>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="card card-interactive p-4 flex items-center justify-center gap-2 text-[var(--primary)]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[15px] font-medium">Tambah Hauler</span>
          </button>
          <button
            onClick={handleShare}
            disabled={haulers.length === 0}
            className="card card-interactive p-4 flex items-center justify-center gap-2 text-[var(--success)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[15px] font-medium">Share WA</span>
          </button>
        </section>

        {/* Activity Log */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Activity Log</h3>
            {activityLog.length > 0 && (
              <button
                onClick={handleClearLog}
                className="flex items-center gap-1 text-[13px] text-[var(--muted)] hover:text-[var(--error)] transition-colors press-effect"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto">
            {activityLog.length > 0 ? (
              <div className="divide-y divide-black/5">
                {activityLog.slice(0, 10).map((log, index) => (
                  <div
                    key={index}
                    className="px-4 py-2.5 flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Clock className="w-4 h-4 text-[var(--muted)] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--foreground)] truncate">{log.message}</p>
                      <p className="text-[11px] text-[var(--muted)]">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-[var(--muted)]">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </section>

        {/* Hauler List */}
        <section className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-black/5">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Daftar Hauler</h3>
          </div>
          {haulers.length > 0 ? (
            <div className="divide-y divide-black/5">
              {haulers.map((hauler, index) => (
                <div
                  key={hauler.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <HaulerCard
                    hauler={hauler}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onDelete={handleDeleteClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 flex items-center justify-center mb-4">
                <Truck className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <p className="text-[17px] font-semibold text-[var(--foreground)] text-center">
                Belum ada hauler
              </p>
              <p className="text-[14px] text-[var(--muted)] mt-1 text-center max-w-[200px]">
                Tambahkan hauler pertama untuk mulai mencatat retase
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-5 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-[15px] flex items-center gap-2 transition-colors press-effect"
              >
                <Plus className="w-4 h-4" />
                Tambah Hauler
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <AddHaulerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddHauler}
        existingRoutes={routes}
      />

      <DeleteHaulerModal
        isOpen={deleteModal.isOpen}
        haulerName={deleteModal.hauler?.name || ''}
        onClose={() => setDeleteModal({ isOpen: false, hauler: null })}
        onConfirm={handleDeleteConfirm}
      />

      <BottomNav />
    </div>
  );
}
