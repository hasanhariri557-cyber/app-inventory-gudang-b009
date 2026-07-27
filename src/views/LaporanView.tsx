import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Filter, Calendar, FileSpreadsheet } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

type ReportType = 
  | 'incoming'
  | 'outbound'
  | 'reject'
  | 'stock'
  | 'pallet_in'
  | 'pallet_out'
  | 'stock_opname'
  | 'vendor_mobil'
  | 'kartu_stock';

interface LaporanViewProps {
  onOpenSpreadsheetModal?: () => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ onOpenSpreadsheetModal }) => {
  const { 
    currentUser,
    incomingHeaders, 
    outboundHeaders, 
    rejects, 
    materials, 
    stockOpnames, 
    kartuStocks,
    closeNotification
  } = useWms();

  useEffect(() => {
    closeNotification();
  }, [closeNotification]);

  const [activeReport, setActiveReport] = useState<ReportType>('incoming');
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr.substring(0, 8) + '01');
  const [endDate, setEndDate] = useState(todayStr);

  const filterByDate = (tanggalStr: string) => {
    if (!tanggalStr) return true;
    return tanggalStr >= startDate && tanggalStr <= endDate;
  };

  const reportsList: { key: ReportType; label: string }[] = [
    { key: 'incoming', label: '1. Laporan Incoming' },
    { key: 'outbound', label: '2. Laporan Outbound' },
    { key: 'reject', label: '3. Laporan Reject' },
    { key: 'stock', label: '4. Laporan Stock Material' },
    { key: 'pallet_in', label: '5. Laporan Pallet IN' },
    { key: 'pallet_out', label: '6. Laporan Pallet OUT' },
    { key: 'stock_opname', label: '7. Laporan Stock Opname' },
    { key: 'vendor_mobil', label: '8. Laporan Vendor Mobil Masuk' },
    { key: 'kartu_stock', label: '9. Laporan Kartu Stock' }
  ];

  // Generate Report Table Data Based on Active Report
  const getReportData = () => {
    switch (activeReport) {
      case 'incoming':
        return incomingHeaders
          .filter(h => filterByDate(h.tanggal))
          .map(h => ({
            'Tanggal': h.tanggal,
            'Vendor': h.vendor,
            'No PO': h.nomorPO,
            'No Surat Jalan': h.noSuratJalan,
            'Plat Kendaraan': h.platKendaraan,
            'Pallet IN': h.palletInCount,
            'Items': h.details.length
          }));

      case 'outbound':
        return outboundHeaders
          .filter(o => filterByDate(o.tanggal))
          .map(o => ({
            'Nomor DO/SJ': o.nomorDOSJ,
            'Tanggal': o.tanggal,
            'Customer': o.customer,
            'Ekspedisi': o.ekspedisi,
            'Pallet OUT': o.palletOutCount,
            'Jumlah SKU': o.details.length
          }));

      case 'reject':
        return rejects
          .filter(r => filterByDate(r.tanggal))
          .map(r => ({
            'Tanggal': r.tanggal,
            'Material ID': r.materialId,
            'Nama Barang': r.namaBarang,
            'Vendor': r.vendor,
            'PO Pembelian': r.poPembelian,
            'Qty Reject': r.qtyReject,
            'Alasan Reject': r.alasanReject,
            'No Dokumen Retur': r.poReturDokumen,
            'Status': r.status
          }));

      case 'stock':
        return materials.map(m => ({
          'Material ID': m.id,
          'Nama Barang': m.namaBarang,
          'Kategori': m.kategori,
          'Satuan': m.satuan,
          'Stok Fisik': m.currentStock,
          'Status Stock': m.currentStock <= 0 ? 'HABIS' : m.currentStock <= m.minStock ? 'KRITIS' : 'AMAN'
        }));

      case 'pallet_in':
        return incomingHeaders
          .filter(h => filterByDate(h.tanggal))
          .map(h => ({
            'Tanggal': h.tanggal,
            'Vendor': h.vendor,
            'Plat Mobil': h.platKendaraan,
            'Jumlah Pallet IN': h.palletInCount
          }));

      case 'pallet_out':
        return outboundHeaders
          .filter(o => filterByDate(o.tanggal))
          .map(o => ({
            'Tanggal': o.tanggal,
            'Nomor DO/SJ': o.nomorDOSJ,
            'Customer': o.customer,
            'Ekspedisi': o.ekspedisi,
            'Jumlah Pallet OUT': o.palletOutCount
          }));

      case 'stock_opname':
        return stockOpnames
          .filter(s => filterByDate(s.tanggal))
          .map(s => ({
            'Tanggal': s.tanggal,
            'Material ID': s.materialId,
            'Nama Barang': s.namaBarang,
            'Qty Sistem': s.qtySistem,
            'Qty Fisik': s.qtyFisik,
            'Selisih': s.selisih,
            'Penyebab': s.penyebab,
            'Status': s.status,
            'PIC': s.pic
          }));

      case 'vendor_mobil':
        return incomingHeaders
          .filter(h => filterByDate(h.tanggal))
          .map(h => ({
            'Tanggal': h.tanggal,
            'Vendor': h.vendor,
            'Plat Kendaraan': h.platKendaraan,
            'Nomor PO': h.nomorPO,
            'No Surat Jalan': h.noSuratJalan
          }));

      case 'kartu_stock':
        return kartuStocks
          .filter(k => filterByDate(k.tanggal))
          .map(k => ({
            'Tanggal': k.tanggal,
            'Material ID': k.materialId,
            'Jenis Transaksi': k.jenisTransaksi,
            'No Ref': k.refNo,
            'Masuk': k.masuk,
            'Keluar': k.keluar,
            'Saldo': k.saldo,
            'Keterangan': k.keterangan || '-'
          }));
    }
  };

  const reportData = getReportData();

  const handleExportExcel = () => {
    const reportTitle = reportsList.find(r => r.key === activeReport)?.label || 'Laporan_WMS';
    exportToExcel(reportData, reportTitle.replace(/[^a-zA-Z0-9]/g, '_'), 'Report Sheet');
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    const reportTitle = reportsList.find(r => r.key === activeReport)?.label || 'Laporan WMS';
    const columns = Object.keys(reportData[0]);
    const rows = reportData.map(row => Object.values(row));

    exportToPDF(
      reportTitle.toUpperCase(),
      columns,
      rows,
      reportTitle.replace(/[^a-zA-Z0-9]/g, '_'),
      `Periode: ${startDate} s/d ${endDate}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span>Pusat Laporan transaksi Gudang Pancawati & Analitik</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor Laporan Gudang Pancawati (Incoming, Outbound, Pallet, Stock Gudang, Opname).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser.role === 'Admin' && onOpenSpreadsheetModal && (
            <button
              onClick={onOpenSpreadsheetModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Integrasi & Sync Google Sheets / Excel (Khusus Admin)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets Sync</span>
            </button>
          )}

          {currentUser.role === 'Admin' && (
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Ekspor Excel (Khusus Admin)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Report Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {reportsList.map(r => (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeReport === r.key 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Presets */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
            />
          </div>
          <div className="flex items-center space-x-1 border-l border-slate-300 pl-2">
            <button
              type="button"
              onClick={() => {
                const t = new Date().toISOString().split('T')[0];
                setStartDate(t);
                setEndDate(t);
              }}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date().toISOString().split('T')[0];
                setStartDate(t.substring(0, 8) + '01');
                setEndDate(t);
              }}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Bulan Ini
            </button>
          </div>
        </div>

      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Preview {reportsList.find(r => r.key === activeReport)?.label} ({reportData.length} Baris Data)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Siap Cetak / Unduh</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            {reportData.length > 0 && (
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  {Object.keys(reportData[0]).map((key, i) => (
                    <th key={i} className="p-3">{key}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data untuk laporan ini pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="p-3 text-slate-800">
                        {String(val)}
                      </td>
                    ))}
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
