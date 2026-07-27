import React, { useState } from 'react';
import { AlertTriangle, Clock, Truck, CheckCircle2, FileText, Search, Printer } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { RejectIncoming } from '../types';
import { exportToPDF } from '../utils/exportUtils';

export const MonitoringRejectView: React.FC = () => {
  const { rejects, updateRejectStatus } = useWms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleStatusStep = (id: string, currentStatus: RejectIncoming['status']) => {
    if (currentStatus === 'Titip gudang') updateRejectStatus(id, 'Tunggu muat');
    else if (currentStatus === 'Tunggu muat') updateRejectStatus(id, 'Selesai muat');
  };

  const handlePrintReturPDF = (item: RejectIncoming) => {
    const columns = ['Parameter', 'Keterangan Rincian Dokumen Retur'];
    const rows = [
      ['Dokumen Retur ID', item.poReturDokumen],
      ['Tanggal', item.tanggal],
      ['Material ID / Nama', `${item.materialId} - ${item.namaBarang}`],
      ['Vendor', item.vendor],
      ['PO Pembelian', item.poPembelian],
      ['Qty Reject', `${item.qtyReject} Unit`],
      ['Alasan Reject', item.alasanReject],
      ['Status Pengembalian', item.status]
    ];

    exportToPDF(
      'DOKUMEN RETUR / PENGEMBALIAN BARANG REJECT',
      columns,
      rows,
      `Dokumen_Retur_${item.poReturDokumen}`,
      `Dokumen Resmi Gudang - Vendor: ${item.vendor}`
    );
  };

  const filteredRejects = rejects.filter(r => {
    const matchSearch = 
      r.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
      r.materialId.toLowerCase().includes(search.toLowerCase()) ||
      r.vendor.toLowerCase().includes(search.toLowerCase()) ||
      r.poReturDokumen.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>Monitoring Reject Incoming</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan barang reject saat penerimaan, penitipan sementara di gudang, dan status muat retur ke vendor.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-700">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold">
            Total Reject: {rejects.length} Item
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Material, Vendor, PO, atau Dokumen Retur..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
        >
          <option value="ALL">Semua Status Retur</option>
          <option value="Titip gudang">Titip gudang</option>
          <option value="Tunggu muat">Tunggu muat</option>
          <option value="Selesai muat">Selesai muat</option>
        </select>
      </div>

      {/* Rejects Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Material ID / Nama</th>
                <th className="p-3.5">PO Pembelian</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Qty Reject</th>
                <th className="p-3.5">Alasan Reject</th>
                <th className="p-3.5">No Retur Dokumen</th>
                <th className="p-3.5">Status Retur</th>
                <th className="p-3.5 text-center">Aksi / Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRejects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Tidak ada catatan barang reject.
                  </td>
                </tr>
              ) : (
                filteredRejects.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500">{r.tanggal}</td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-indigo-600">{r.materialId}</div>
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">{r.namaBarang}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">{r.poPembelian}</td>
                    <td className="p-3.5 font-medium text-slate-800">{r.vendor}</td>
                    <td className="p-3.5 font-bold text-rose-600">{r.qtyReject} Unit</td>
                    <td className="p-3.5 text-slate-600 italic max-w-[160px] truncate">{r.alasanReject}</td>
                    <td className="p-3.5 font-mono text-amber-700 font-bold">{r.poReturDokumen}</td>
                    <td className="p-3.5">
                      {r.status === 'Titip gudang' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Titip gudang</span>
                        </span>
                      )}
                      {r.status === 'Tunggu muat' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                          <Truck className="w-3 h-3" />
                          <span>Tunggu muat</span>
                        </span>
                      )}
                      {r.status === 'Selesai muat' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai muat</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center space-x-2">
                      {r.status !== 'Selesai muat' && (
                        <button
                          onClick={() => handleStatusStep(r.id, r.status)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg transition-all"
                        >
                          {r.status === 'Titip gudang' ? 'Muat Truk' : 'Selesaikan Muat'}
                        </button>
                      )}

                      <button
                        onClick={() => handlePrintReturPDF(r)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                        title="Cetak Dokumen Retur PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
