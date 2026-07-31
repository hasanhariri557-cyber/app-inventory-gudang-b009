import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  FileSpreadsheet,
  Printer,
  Boxes,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useWms } from '../context/WmsContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export const KartuStockView: React.FC = () => {
  const { currentUser, kartuStocks, materials } = useWms();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [chartMode, setChartMode] = useState<'selected' | 'all'>('selected');

  const activeMaterialId = selectedMaterialId || materials[0]?.id || '';
  const selectedMaterial = materials.find(m => m.id === activeMaterialId) || materials[0];

  // Filter & sort ledger entries for selected material
  const sortedEntries = kartuStocks
    .filter(k => k.materialId === activeMaterialId)
    .sort((a, b) => {
      const dateCompare = a.tanggal.localeCompare(b.tanggal);
      if (dateCompare !== 0) return dateCompare;
      return a.id.localeCompare(b.id);
    });

  // Dynamically calculate accurate running balance
  let runningBalance = 0;
  const filteredEntries = sortedEntries.map(e => {
    runningBalance = runningBalance + e.masuk - e.keluar;
    return {
      ...e,
      saldo: runningBalance
    };
  });

  // Generate last 30 days date list (YYYY-MM-DD)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  // Chart data computation
  const chartData = last30Days.map(date => {
    const entriesOnDate = kartuStocks.filter(k => {
      const matchesDate = k.tanggal === date;
      const matchesMaterial = chartMode === 'all' || k.materialId === activeMaterialId;
      return matchesDate && matchesMaterial;
    });

    const totalIn = entriesOnDate.reduce((sum, e) => sum + e.masuk, 0);
    const totalOut = entriesOnDate.reduce((sum, e) => sum + e.keluar, 0);

    return {
      date,
      'Masuk (In)': totalIn,
      'Keluar (Out)': totalOut,
    };
  });

  const totalIn30Days = chartData.reduce((sum, d) => sum + d['Masuk (In)'], 0);
  const totalOut30Days = chartData.reduce((sum, d) => sum + d['Keluar (Out)'], 0);
  const netFlow30Days = totalIn30Days - totalOut30Days;

  const formatXAxis = (tickItem: string) => {
    try {
      const parts = tickItem.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = parseInt(parts[2], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        return `${day} ${months[monthIdx]}`;
      }
    } catch (e) {}
    return tickItem;
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const day = parseInt(parts[2], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        return `${day} ${months[monthIdx]} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg space-y-1 text-xs">
          <p className="font-bold text-slate-700">{formatDateIndo(label)}</p>
          {payload.map((pld: any) => (
            <p key={pld.name} className="font-semibold flex items-center gap-1.5" style={{ color: pld.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
              <span>{pld.name}: {pld.value} {chartMode === 'selected' ? selectedMaterial?.satuan : 'Unit'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
      `Nama Barang: ${selectedMaterial.namaBarang || selectedMaterial.nama} | Satuan: ${selectedMaterial.satuan} | Kategori: ${selectedMaterial.kategori}`
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
            <span>Cetak PDF</span>
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
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 mt-1 cursor-pointer"
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.id} - {m.namaBarang || m.nama}</option>
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

      {/* 30-Day Movement Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Tren Aliran Masuk & Keluar (30 Hari Terakhir)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Grafik Perbandingan Volume Barang Masuk Vs Barang Keluar Untuk Mendeteksi Tingkat Perputaran.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setChartMode('selected')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                chartMode === 'selected'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Material Terpilih
            </button>
            <button
              onClick={() => setChartMode('all')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                chartMode === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Material
            </button>
          </div>
        </div>

        {/* Mini stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Masuk (In)</p>
              <p className="text-lg font-black text-emerald-700 mt-1">
                +{totalIn30Days} <span className="text-xs font-normal text-emerald-600">{chartMode === 'selected' ? selectedMaterial?.satuan : 'Unit'}</span>
              </p>
            </div>
            <ArrowDownCircle className="w-8 h-8 text-emerald-500/30" />
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Total Keluar (Out)</p>
              <p className="text-lg font-black text-rose-700 mt-1">
                -{totalOut30Days} <span className="text-xs font-normal text-rose-600">{chartMode === 'selected' ? selectedMaterial?.satuan : 'Unit'}</span>
              </p>
            </div>
            <ArrowUpCircle className="w-8 h-8 text-rose-500/30" />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sisa Bersih (Net Flow)</p>
              <p className={`text-lg font-black mt-1 ${netFlow30Days >= 0 ? 'text-slate-800' : 'text-rose-700'}`}>
                {netFlow30Days > 0 ? `+${netFlow30Days}` : netFlow30Days} <span className="text-xs font-normal text-slate-500">{chartMode === 'selected' ? selectedMaterial?.satuan : 'Unit'}</span>
              </p>
            </div>
            <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#475569' }}
              />
              <Area
                type="monotone"
                dataKey="Masuk (In)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIn)"
              />
              <Area
                type="monotone"
                dataKey="Keluar (Out)"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOut)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
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
