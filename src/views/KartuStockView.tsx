import React, { useState } from 'react';
import { CreditCard, Search, FileSpreadsheet, Printer, Boxes } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export const KartuStockView: React.FC = () => {
  const { currentUser, kartuStocks, materials } = useWms();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');

  const activeMaterialId = selectedMaterialId || materials[0]?.id || '';
  const selectedMaterial = materials.find(m => m.id === activeMaterialId) || materials[0];

  // Filter & sort ledger entries for selected material
  const filteredEntries = kartuStocks
    .filter(k => k.materialId === activeMaterialId)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const handleExportExcel = () => {
    if (!selectedMaterial) return;
    const rows = filteredEntries.map(e => ({
      'Tanggal': e.tanggal,
      'Jenis Transaksi': e.jenisTransaksi,
      'Gedung / Lokasi': e.lokasi || '-',
      'Masuk (+)': e.masuk,
      'Keluar (-)': e.keluar,
      'Saldo Running': e.saldo,
      'Keterangan': e.keterangan || '-'
    }));
    exportToExcel(rows, `Kartu_Stok_${selectedMaterial.id}`, 'Kartu Stok');
  };

  const handleExportPDF = () => {
    if (!selectedMaterial) return;
    const columns = ['Tanggal', 'Jenis Transaksi', 'Gedung / Lokasi', 'Masuk (+)', 'Keluar (-)', 'Saldo', 'Keterangan'];
    const rows = filteredEntries.map(e => [
      e.tanggal,
      e.jenisTransaksi,
      e.lokasi || '-',
      e.masuk,
      e.keluar,
      e.saldo,
      e.keterangan || '-'
    ]);

    exportToPDF(
      `KARTU STOK MATERIAL: ${selectedMaterial.id}`,
      columns,
      rows,
      `Kartu_Stok_${selectedMaterial.id}`,
      `Nama Barang: ${selectedMaterial.namaBarang} | Satuan: ${selectedMaterial.satuan} | Kategori: ${selectedMaterial.kategori}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <span>Kartu Stock (Report Transaksi Material)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan riwayat transaksi mutasi masuk, keluar, dan saldo berjalan per material SKU.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser.role === 'Admin' && (
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              title="Ekspor Excel (Khusus Admin)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu PDF</span>
          </button>
        </div>
      </div>

      {/* Material Selector Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase">Pilih Material SKU</label>
            <select
              value={selectedMaterialId}
              onChange={e => setSelectedMaterialId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 mt-1"
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.id} - {m.namaBarang}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedMaterial && (
          <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500">Kategori / Satuan</p>
              <p className="text-xs font-bold text-slate-800">{selectedMaterial.kategori} ({selectedMaterial.satuan})</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-500">Saldo Akhir Saat Ini</p>
              <p className="text-base font-extrabold text-emerald-600">{selectedMaterial.currentStock} {selectedMaterial.satuan}</p>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jenis Transaksi</th>
                <th className="p-3.5 text-indigo-600">Gedung / Lokasi</th>
                <th className="p-3.5 text-emerald-600">Masuk (+)</th>
                <th className="p-3.5 text-rose-600">Keluar (-)</th>
                <th className="p-3.5 text-indigo-600 font-bold">Saldo Akhir</th>
                <th className="p-3.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada catatan transaksi untuk material ini.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500 font-medium">{e.tanggal}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.jenisTransaksi === 'Incoming' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        e.jenisTransaksi === 'Outbound' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {e.jenisTransaksi}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {e.lokasi ? (
                        <span className="inline-flex items-center space-x-1 text-xs text-slate-700 font-medium px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>{e.lokasi}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">{e.masuk > 0 ? `+${e.masuk}` : '-'}</td>
                    <td className="p-3.5 font-bold text-rose-600">{e.keluar > 0 ? `-${e.keluar}` : '-'}</td>
                    <td className="p-3.5 font-black text-slate-900 bg-slate-50/80">{e.saldo}</td>
                    <td className="p-3.5 text-slate-500 italic">{e.keterangan || '-'}</td>
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
