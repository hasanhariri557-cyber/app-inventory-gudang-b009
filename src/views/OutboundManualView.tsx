import React, { useState } from 'react';
import { ArrowUpRight, Plus, Trash2, FileSpreadsheet, Printer, Search, FileText } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { OutboundDetail, OutboundHeader } from '../types';
import { exportToExcel, generateSuratJalanPDF } from '../utils/exportUtils';

export const OutboundManualView: React.FC = () => {
  const { outboundHeaders, currentUser, addOutbound, showNotification, appLogoUrl } = useWms();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // Timezone-safe local date YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const today = getLocalDateString();
  const [filterDate, setFilterDate] = useState(today);
  const [nomorDOSJ, setNomorDOSJ] = useState('SJ-MANUAL-2026-001');
  const [customer, setCustomer] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [ekspedisi, setEkspedisi] = useState('');
  const [noKendaraan, setNoKendaraan] = useState('');

  const [details, setDetails] = useState<Omit<OutboundDetail, 'id'>[]>(() => {
    return [
      {
        materialId: '',
        namaBarang: '',
        qty: 1,
        satuan: 'Pcs',
        picChecker: currentUser.nama,
        keterangan: ''
      }
    ];
  });

  const handleAddLine = () => {
    setDetails(prev => [
      ...prev,
      {
        materialId: '',
        namaBarang: '',
        qty: 1,
        satuan: 'Pcs',
        picChecker: currentUser.nama,
        keterangan: ''
      }
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (details.length > 1) {
      setDetails(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.length === 0) return;

    const parseVal = (v: any) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const clean = String(v).replace(/,/g, '.');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parsedDetails = details.map((d, i) => ({
      ...d,
      id: `OUTD-MAN-${Date.now()}-${i}`,
      qty: parseVal(d.qty)
    }));

    // Basic Validation (Check empty fields & Qty > 0)
    for (const detail of parsedDetails) {
      if (detail.qty <= 0) {
        showNotification(
          'Error Validasi',
          `Jumlah kirim untuk ${detail.namaBarang || 'item'} harus lebih dari 0.`,
          'error',
          'Surat Jalan Manual'
        );
        return;
      }
      if (!detail.materialId.trim()) {
        showNotification(
          'Error Validasi',
          `Kolom Material ID / SKU harus diisi.`,
          'error',
          'Surat Jalan Manual'
        );
        return;
      }
      if (!detail.namaBarang.trim()) {
        showNotification(
          'Error Validasi',
          `Kolom Nama Barang harus diisi.`,
          'error',
          'Surat Jalan Manual'
        );
        return;
      }
      if (!detail.satuan.trim()) {
        showNotification(
          'Error Validasi',
          `Kolom Satuan harus diisi.`,
          'error',
          'Surat Jalan Manual'
        );
        return;
      }
    }

    const payload: OutboundHeader = {
      nomorDOSJ,
      customer,
      tanggal,
      ekspedisi,
      noKendaraan,
      palletOutCount: 0,
      isManual: true,
      details: parsedDetails,
      id: `OUT-MAN-${Date.now()}`
    };

    addOutbound(payload);

    setIsFormOpen(false);
    setNoKendaraan('');
    setCustomer('');
    setEkspedisi('');
    setDetails([
      {
        materialId: '',
        namaBarang: '',
        qty: 1,
        satuan: 'Pcs',
        picChecker: currentUser.nama,
        keterangan: ''
      }
    ]);
    
    // Automatically trigger printing for the newly created manual delivery
    setTimeout(() => {
      generateSuratJalanPDF(payload, appLogoUrl);
    }, 500);
  };

  const filteredOutbounds = outboundHeaders.filter(o => {
    // Only show manual ones
    if (!o.isManual) return false;

    const matchesSearch = o.nomorDOSJ.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.ekspedisi.toLowerCase().includes(search.toLowerCase()) ||
      (o.noKendaraan || '').toLowerCase().includes(search.toLowerCase());

    if (showTodayOnly) {
      return matchesSearch && o.tanggal === filterDate;
    }
    return matchesSearch;
  });

  const handleExportExcel = () => {
    const rows = outboundHeaders.filter(o => o.isManual).map(o => ({
      'Nomor SJ Manual': o.nomorDOSJ,
      'Tanggal': o.tanggal,
      'Customer': o.customer,
      'Ekspedisi': o.ekspedisi,
      'No Kendaraan': o.noKendaraan || '-',
      'Jumlah SKU': o.details.length
    }));
    exportToExcel(rows, 'Laporan_Surat_Jalan_Manual', 'Surat_Jalan_Manual');
  };

  return (
    <div className="space-y-6" id="outbound-manual-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span>Surat Jalan Manual</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan surat jalan manual dengan ketik manual bebas tanpa mempengaruhi atau memotong saldo stok fisik gudang sistem, serta bisa langsung dicetak PDF.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition-all"
            id="btn-export-excel-manual"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => {
              setNomorDOSJ(`SJM-${Date.now().toString().slice(-6)}`);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all animate-pulse-subtle"
            id="btn-create-sj-manual"
          >
            <Plus className="w-4 h-4" />
            <span>Buat SJ Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3" id="filter-bar-manual">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Nomor SJ Manual, Customer, Ekspedisi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Date Filter Segmented Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0 gap-1 items-center">
          <div
            onClick={() => setShowTodayOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              showTodayOnly 
                ? 'bg-white text-indigo-950 shadow-xs' 
                : 'text-slate-500 hover:text-indigo-800'
            }`}
          >
            <span>Filter Tanggal:</span>
            <input
              type="date"
              value={filterDate}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setShowTodayOnly(true);
              }}
              className="bg-transparent border-none text-xs font-bold focus:outline-none focus:ring-0 p-0 text-slate-950 outline-none w-28 cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowTodayOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer ${
              !showTodayOnly 
                ? 'bg-white text-indigo-950 shadow-xs' 
                : 'text-slate-500 hover:text-indigo-800'
            }`}
          >
            <span>Semua Riwayat</span>
          </button>
        </div>
      </div>

      {/* Table Outbound */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nomor SJ Manual</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Customer / Tujuan</th>
                <th className="p-3.5">Ekspedisi</th>
                <th className="p-3.5">No. Kendaraan</th>
                <th className="p-3.5 text-center">Items</th>
                <th className="p-3.5 text-center">Aksi & Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOutbounds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada transaksi Surat Jalan Manual.
                  </td>
                </tr>
              ) : (
                filteredOutbounds.map(o => {
                  const isExpanded = expandedId === o.id;
                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{o.nomorDOSJ}</td>
                        <td className="p-3.5 text-slate-600">{o.tanggal}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{o.customer}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{o.ekspedisi}</td>
                        <td className="p-3.5 font-mono text-slate-700 font-medium">{o.noKendaraan || '-'}</td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{o.details.length}</td>
                        <td className="p-3.5 text-center space-x-2">
                          <button
                            onClick={() => generateSuratJalanPDF(o, appLogoUrl)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-all inline-flex items-center space-x-1 shadow-xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak PDF</span>
                          </button>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : o.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg transition-all"
                          >
                            {isExpanded ? 'Tutup' : 'Rincian'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Line Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={7} className="p-4">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                              <h4 className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Rincian Barang Dikirim (SJ: {o.nomorDOSJ})</span>
                              </h4>
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                                  <tr>
                                    <th className="p-2">Material ID / SKU</th>
                                    <th className="p-2">Nama Barang</th>
                                    <th className="p-2">Qty</th>
                                    <th className="p-2">Satuan</th>
                                    <th className="p-2">PIC Checker</th>
                                    <th className="p-2">Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {o.details.map((d, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2 font-mono text-indigo-600 font-bold">{d.materialId}</td>
                                      <td className="p-2 font-semibold text-slate-900">{d.namaBarang}</td>
                                      <td className="p-2 font-bold text-indigo-600">{d.qty}</td>
                                      <td className="p-2 text-slate-500 font-medium">{d.satuan}</td>
                                      <td className="p-2 text-slate-700">{d.picChecker}</td>
                                      <td className="p-2 text-slate-500 italic">{d.keterangan || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL OUTBOUND */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto" id="modal-form-manual">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-800 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Form Surat Jalan Manual</span>
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SJ Manual</label>
                  <input
                    type="text"
                    required
                    value={nomorDOSJ}
                    onChange={e => setNomorDOSJ(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima / Customer</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Penerima / Perusahaan"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ekspedisi / Transport</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Ekspedisi / Kurir"
                    value={ekspedisi}
                    onChange={e => setEkspedisi(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Kendaraan (Plat Nomor)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 1234 ABC"
                    value={noKendaraan}
                    onChange={e => setNoKendaraan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Items Dikirim (Ketik Manual)</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {details.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Material ID / SKU</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: SKU-001"
                          value={item.materialId}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, materialId: val } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Nama Barang</label>
                        <input
                          type="text"
                          required
                          placeholder="Nama barang..."
                          value={item.namaBarang}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, namaBarang: val } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Kirim</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={item.qty}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, qty: val as any } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold text-indigo-600"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Satuan</label>
                        <input
                          type="text"
                          required
                          placeholder="Pcs/Box"
                          value={item.satuan}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, satuan: val } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Keterangan</label>
                        <input
                          type="text"
                          value={item.keterangan}
                          placeholder="Catatan..."
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, keterangan: val } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Proses & Cetak SJ Manual
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
