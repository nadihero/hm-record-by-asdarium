'use client';

import { Clock, Truck, User, Calendar, Eye, Trash2 } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

interface RecordCardProps {
  id: string;
  tanggal: Date | string;
  namaOperator: string;
  unitAlat: string;
  hmAwal: number;
  hmAkhir: number;
  totalJam: number;
  fotoPath: string;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function RecordCard({
  id,
  tanggal,
  namaOperator,
  unitAlat,
  hmAwal,
  hmAkhir,
  totalJam,
  onView,
  onDelete,
}: RecordCardProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#0082c1]/10 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#0082c1]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#0082c1]">{formatNumber(totalJam)} Jam</p>
            <p className="text-xs text-gray-500">Total HM</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(id)}
              className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{formatDate(tanggal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{namaOperator}</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{unitAlat}</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="text-gray-400">HM:</span> {formatNumber(hmAwal)} → {formatNumber(hmAkhir)}
        </div>
      </div>
    </div>
  );
}
