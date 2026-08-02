import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Filter, Calendar, FileSpreadsheet, Trash2, Search } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { exportToExcel, exportToPDF, generateSuratJalanPDF } from '../utils/exportUtils';

type ReportType = 
  | 'incoming'
  | 'outbound'
  | 'reject'
  | 'stock'
  | 'pallet_in'
  | 'pallet_out'
  | 'stock_opname'
  | 'vendor_mobil'
  | 'kartu_stock'
  | 'forklift_work';

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
    mutasis,
    forkliftActivities,
    users,
    closeNotification,
    deleteIncoming,
    deleteOutbound,
    deleteReject,
    deleteStockOpname,
    deleteKartuStock,
    deleteMaterial,
    deleteForkliftActivity,
    appLogoUrl
  } = useWms();

  useEffect(() => {
    closeNotification();
  }, [closeNotification]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: ReportType;
    label: string;
  } | null>(null);

  const isAdmin = currentUser && currentUser.role === 'Admin';

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    
    try {
      if (type === 'incoming' || type === 'pallet_in' || type === 'vendor_mobil') {
        const targetIncoming = incomingHeaders.find(h => h.id === id || h.noReceiving === id || h.noSuratJalan === id);
        if (targetIncoming) {
          await deleteIncoming(targetIncoming.id);
        } else {
          await deleteIncoming(id);
        }
      } else if (type === 'outbound' || type === 'pallet_out') {
        const targetOutbound = outboundHeaders.find(o => o.id === id || o.nomorDOSJ === id);
        if (targetOutbound) {
          await deleteOutbound(targetOutbound.id);
        } else {
          await deleteOutbound(id);
        }
      } else if (type === 'reject') {
        await deleteReject(id);
      } else if (type === 'stock') {
        await deleteMaterial(id);
      } else if (type === 'stock_opname') {
        await deleteStockOpname(id);
      } else if (type === 'kartu_stock') {
        await deleteKartuStock(id);
      } else if (type === 'forklift_work') {
        await deleteForkliftActivity(id);
      }
    } catch (err) {
      console.error("Error executing delete:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const [activeReport, setActiveReport] = useState<ReportType>('incoming');
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr.substring(0, 8) + '01');
  const [endDate, setEndDate] = useState(todayStr);

  // Quick Search & Column Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Reset filters when changing active report
  useEffect(() => {
    setSearchQuery('');
    setColumnFilters({});
  }, [activeReport]);

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
            'Material ID': h.details.map(d => d.materialId).join('\n'),
            'Nama Barang': h.details.map(d => d.namaBarang).join('\n'),
            'Vendor': h.vendor,
            'Plat Kendaraan': h.platKendaraan || '-',
            'No SJ': h.noSuratJalan,
            'No PO': h.nomorPO,
            'Qty Diterima': h.details.map(d => d.qtyDiterima.toLocaleString('id-ID')).join('\n'),
            'Jumlah Pallet': `${h.palletInCount} Pallet`,
            'Status': h.details.map(d => d.status || 'Good Receiving').join('\n')
          }));

      case 'outbound':
        return outboundHeaders
          .filter(o => filterByDate(o.tanggal))
          .map(o => ({
            'Nomor DO / SJ': o.nomorDOSJ,
            'Tanggal': o.tanggal,
            'Material ID': o.details.map(d => d.materialId).join('\n'),
            'Nama Barang': o.details.map(d => d.namaBarang).join('\n'),
            'Qty': o.details.map(d => d.qty.toLocaleString('id-ID')).join('\n'),
            'Satuan': o.details.map(d => d.satuan).join('\n'),
            'Lokasi': o.details.map(d => d.gedungAsal || '-').join('\n'),
            'Pallet OUT': `${o.palletOutCount} Pallet`,
            'Customer / Tujuan': o.customer,
            'Ekspedisi': o.ekspedisi,
            'No. Kendaraan': o.noKendaraan || '-',
            'PIC Checker': o.details.map(d => d.picChecker || '-').join('\n'),
            'Keterangan': o.details.map(d => d.keterangan || '-').join('\n')
          }));

      case 'forklift_work': {
        const filteredIncoming = incomingHeaders.filter(h => filterByDate(h.tanggal));
        const filteredOutbound = outboundHeaders.filter(o => filterByDate(o.tanggal));
        const filteredMutasi = mutasis.filter(m => filterByDate(m.tanggal));
        const filteredForkliftActivities = forkliftActivities.filter(f => filterByDate(f.tanggal));

        const operatorSet = new Set<string>();
        users.forEach(u => {
          if (u.role === 'Operator Forklift' || u.nama) {
            operatorSet.add(u.nama);
          }
        });
        filteredIncoming.forEach(h => { if (h.operatorForklift) operatorSet.add(h.operatorForklift); });
        filteredOutbound.forEach(o => { if (o.operatorForklift) operatorSet.add(o.operatorForklift); });
        filteredMutasi.forEach(m => { if (m.operatorForklift) operatorSet.add(m.operatorForklift); });
        filteredForkliftActivities.forEach(f => { if (f.operatorName) operatorSet.add(f.operatorName); });

        const resultMap: Record<string, {
          incomingTx: number;
          outboundTx: number;
          mutasiTx: number;
          forkliftActivitiesTx: number;
          qtyIncoming: number;
          qtyOutbound: number;
          qtyMutasi: number;
          qtyForkliftActivities: number;
          palletIn: number;
          palletOut: number;
          palletMutasi: number;
          palletForkliftActivities: number;
        }> = {};

        operatorSet.forEach(op => {
          resultMap[op] = {
            incomingTx: 0, outboundTx: 0, mutasiTx: 0, forkliftActivitiesTx: 0,
            qtyIncoming: 0, qtyOutbound: 0, qtyMutasi: 0, qtyForkliftActivities: 0,
            palletIn: 0, palletOut: 0, palletMutasi: 0, palletForkliftActivities: 0
          };
        });

        filteredIncoming.forEach(h => {
          const op = h.operatorForklift;
          if (op && resultMap[op]) {
            resultMap[op].incomingTx += 1;
            resultMap[op].palletIn += (h.palletInCount || 0);
            const sumQty = h.details.reduce((acc, d) => acc + (d.qtyDiterima || 0), 0);
            resultMap[op].qtyIncoming += sumQty;
          }
        });

        filteredOutbound.forEach(o => {
          const op = o.operatorForklift;
          if (op && resultMap[op]) {
            resultMap[op].outboundTx += 1;
            resultMap[op].palletOut += (o.palletOutCount || 0);
            const sumQty = o.details.reduce((acc, d) => acc + (d.qty || 0), 0);
            resultMap[op].qtyOutbound += sumQty;
          }
        });

        filteredMutasi.forEach(m => {
          const op = m.operatorForklift;
          if (op && resultMap[op]) {
            resultMap[op].mutasiTx += 1;
            resultMap[op].palletMutasi += 1;
            resultMap[op].qtyMutasi += (m.qty || 0);
          }
        });

        filteredForkliftActivities.forEach(f => {
          const op = f.operatorName;
          if (op && resultMap[op]) {
            resultMap[op].forkliftActivitiesTx += 1;
            resultMap[op].qtyForkliftActivities += (f.qty || 0);
            resultMap[op].palletForkliftActivities += (f.jumlahPallet || 0);
          }
        });

        return Object.entries(resultMap).map(([nama, data]) => {
          const totalTx = data.incomingTx + data.outboundTx + data.mutasiTx + data.forkliftActivitiesTx;
          const totalQty = data.qtyIncoming + data.qtyOutbound + data.qtyMutasi + data.qtyForkliftActivities;
          const totalPallet = data.palletIn + data.palletOut + data.palletMutasi + data.palletForkliftActivities;
          return {
            'Nama Operator': nama,
            'Total Transaksi Handling': totalTx,
            'Handling Incoming': data.incomingTx,
            'Handling Outbound': data.outboundTx,
            'Handling Mutasi': data.mutasiTx,
            'Aktivitas Forklift': data.forkliftActivitiesTx,
            'Total Qty Dipindahkan': totalQty.toLocaleString('id-ID'),
            'Pallet IN': data.palletIn,
            'Pallet OUT': data.palletOut,
            'Pallet Mutasi': data.palletMutasi,
            'Pallet Aktivitas': data.palletForkliftActivities,
            'Total Pallet Ditangani': totalPallet
          };
        });
      }

      case 'reject':
        return rejects
          .filter(r => filterByDate(r.tanggal))
          .map(r => ({
            'ID Transaksi': r.id,
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
            'ID Transaksi': h.id,
            'Tanggal': h.tanggal,
            'Vendor': h.vendor,
            'Plat Mobil': h.platKendaraan,
            'Jumlah Pallet IN': h.palletInCount
          }));

      case 'pallet_out':
        return outboundHeaders
          .filter(o => filterByDate(o.tanggal))
          .map(o => ({
            'ID Transaksi': o.id,
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
            'ID Transaksi': s.id,
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
            'ID Transaksi': h.id,
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
            'ID Transaksi': k.id,
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

  const reportData = getReportData() || [];

  const filteredReportData = reportData.filter((row: any) => {
    const r = row as Record<string, any>;
    const matchSearch = searchQuery === '' || Object.values(r).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchColumns = Object.entries(columnFilters).every(([colName, filterVal]) => {
      if (!filterVal) return true;
      const cellVal = r[colName];
      return String(cellVal || '').toLowerCase().includes(String(filterVal).toLowerCase());
    });
    
    return matchSearch && matchColumns;
  });

  const handleExportExcel = () => {
    const reportTitle = reportsList.find(r => r.key === activeReport)?.label || 'Laporan_WMS';
    exportToExcel(filteredReportData, reportTitle.replace(/[^a-zA-Z0-9]/g, '_'), 'Report Sheet');
  };

  const handleExportPDF = () => {
    if (filteredReportData.length === 0) return;
    const reportTitle = reportsList.find(r => r.key === activeReport)?.label || 'Laporan WMS';
    const columns = Object.keys(filteredReportData[0]);
    const rows = filteredReportData.map(row => Object.values(row));

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
            <span>Report transaksi Gudang Pancawati</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor Laporan Gudang Pancawati (Incoming, Outbound, Stock Inventory Gudang, Stock Opname).
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
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Preview {reportsList.find(r => r.key === activeReport)?.label} ({filteredReportData.length} dari {reportData.length} Baris Data)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Siap Cetak / Unduh</span>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pencarian cepat laporan..."
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 pl-8 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            {reportData.length > 0 && (
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  {Object.keys(reportData[0]).map((key, i) => (
                    <th key={i} className="p-3">{key}</th>
                  ))}
                  <th className="p-3 text-center font-bold">Aksi</th>
                </tr>
                {/* Column Filters Row */}
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  {Object.keys(reportData[0]).map((key, i) => (
                    <td key={i} className="p-2">
                      <input
                        type="text"
                        value={columnFilters[key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setColumnFilters(prev => ({ ...prev, [key]: val }));
                        }}
                        placeholder={`Filter ${key}...`}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    {Object.values(columnFilters).some(v => v !== '') && (
                      <button
                        type="button"
                        onClick={() => setColumnFilters({})}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </td>
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {filteredReportData.length === 0 ? (
                <tr>
                  <td colSpan={reportData.length > 0 ? Object.keys(reportData[0]).length + 1 : 10} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data ditemukan untuk pencarian/filter ini.
                  </td>
                </tr>
              ) : (
                filteredReportData.map((row, idx) => {
                  const idValue = row['ID Transaksi'] || row['No SJ'] || row['Nomor DO / SJ'] || row['Nomor DO/SJ'] || row['Material ID'] || '';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="p-3 text-slate-800 whitespace-pre-line text-xs">
                          {String(val)}
                        </td>
                      ))}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {activeReport === 'outbound' && (
                            (() => {
                              const outboundItem = outboundHeaders.find(o => o.id === idValue || o.nomorDOSJ === idValue);
                              if (!outboundItem) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => generateSuratJalanPDF(outboundItem, appLogoUrl)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                                  title="Print PDF Surat Jalan"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>
                              );
                            })()
                          )}
                          <button
                            type="button"
                            onClick={() => idValue && setDeleteConfirm({ id: idValue, type: activeReport, label: idValue })}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Konfirmasi Hapus Data
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus data dengan ID <span className="font-semibold text-slate-800">{deleteConfirm.label}</span>? 
                {deleteConfirm.type === 'stock' ? (
                  <span> Tindakan ini akan menghapus data master barang secara permanen.</span>
                ) : deleteConfirm.type === 'forklift_work' ? (
                  <span> Tindakan ini akan menghapus catatan aktivitas forklift secara permanen.</span>
                ) : (
                  <span> Tindakan ini akan menghapus catatan transaksi dan secara otomatis menyesuaikan/mengembalikan jumlah stok material terkait.</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
