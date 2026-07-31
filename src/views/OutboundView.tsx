import React, { useState } from 'react';
import { ArrowUpRight, Plus, Trash2, FileSpreadsheet, Printer, Search, FileText } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { OutboundDetail, OutboundHeader } from '../types';
import { exportToExcel, generateSuratJalanPDF } from '../utils/exportUtils';

interface MaterialSearchSelectProps {
  value: string;
  onChange: (matId: string) => void;
  materials: any[];
  getMaterialStockByGedung: (matId: string) => Record<string, number>;
}

const MaterialSearchSelect: React.FC<MaterialSearchSelectProps> = ({
  value,
  onChange,
  materials,
  getMaterialStockByGedung
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedMaterial = materials.find(m => m.id === value);
  const displayValue = isOpen ? search : (selectedMaterial ? `${selectedMaterial.id} - ${selectedMaterial.namaBarang}` : '');

  const filtered = materials.filter(m => {
    const term = search.toLowerCase();
    return m.id.toLowerCase().includes(term) || m.namaBarang.toLowerCase().includes(term);
  });

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setSearch('');
          setIsOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
          }, 200);
        }}
        placeholder="Ketik nama / ID material..."
        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
      />
      
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 text-center">Tidak ada material cocok</div>
          ) : (
            filtered.map(m => {
              const bStocks = getMaterialStockByGedung(m.id);
              const activeBuildings = Object.entries(bStocks)
                .filter(([_, stock]) => (stock as number) > 0)
                .map(([name, stock]) => `${name}: ${stock}`)
                .join(', ');

              return (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={() => {
                    onChange(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs hover:bg-indigo-50/50 transition-colors border-b border-slate-100 last:border-b-0 block ${m.id === value ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-slate-700'}`}
                >
                  <div className="font-semibold">{m.id} - {m.namaBarang}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Stok Sistem: {m.currentStock} {m.satuan}
                    {activeBuildings && <span className="block text-indigo-600 font-medium">Gedung: {activeBuildings}</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const OutboundView: React.FC = () => {
  const { outboundHeaders, materials, currentUser, addOutbound, gedungList, showNotification, getMaterialStockByGedung, appLogoUrl } = useWms();

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
  const [nomorDOSJ, setNomorDOSJ] = useState('SJ-B009-2026-001');
  const [customer, setCustomer] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [ekspedisi, setEkspedisi] = useState('');
  const [palletOutCount, setPalletOutCount] = useState<number>(8);
  const [noKendaraan, setNoKendaraan] = useState('');

  const [details, setDetails] = useState<Omit<OutboundDetail, 'id'>[]>(() => {
    const mat = materials[0];
    if (!mat) return [];
    const bStocks = getMaterialStockByGedung(mat.id);
    const buildingWithStock = Object.keys(bStocks).find(bName => bStocks[bName] > 0);
    return [
      {
        materialId: mat.id,
        namaBarang: mat.namaBarang,
        qty: 200,
        satuan: mat.satuan,
        picChecker: currentUser.nama,
        keterangan: '',
        gedungAsal: buildingWithStock || mat.lokasiDefaut || 'Gedung E1',
        jumlahPallet: 1
      }
    ];
  });

  const handleAddLine = () => {
    const mat = materials[0];
    if (!mat) return;
    const bStocks = getMaterialStockByGedung(mat.id);
    const buildingWithStock = Object.keys(bStocks).find(bName => bStocks[bName] > 0);

    setDetails(prev => [
      ...prev,
      {
        materialId: mat.id,
        namaBarang: mat.namaBarang,
        qty: 50,
        satuan: mat.satuan,
        picChecker: currentUser.nama,
        keterangan: '',
        gedungAsal: buildingWithStock || mat.lokasiDefaut || 'Gedung E1',
        jumlahPallet: 1
      }
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (details.length > 1) {
      setDetails(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleMaterialChange = (idx: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    const bStocks = getMaterialStockByGedung(mat.id);
    const buildingWithStock = Object.keys(bStocks).find(bName => bStocks[bName] > 0);

    setDetails(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          materialId: mat.id,
          namaBarang: mat.namaBarang,
          satuan: mat.satuan,
          gedungAsal: buildingWithStock || mat.lokasiDefaut || 'Gedung E1'
        };
      }
      return item;
    }));
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
      id: `OUTD-${Date.now()}-${i}`,
      qty: parseVal(d.qty),
      jumlahPallet: parseVal(d.jumlahPallet)
    }));

    // Validate stock levels including potential duplicates
    const requestedStockMap: Record<string, number> = {};
    for (const detail of parsedDetails) {
      if (detail.qty <= 0) {
        showNotification(
          'Error Validasi',
          `Jumlah kirim harus lebih dari 0.`,
          'error',
          'Outbound Delivery'
        );
        return;
      }
      requestedStockMap[detail.materialId] = (requestedStockMap[detail.materialId] || 0) + detail.qty;
    }

    for (const [matId, totalQty] of Object.entries(requestedStockMap)) {
      const mat = materials.find(m => m.id === matId);
      if (!mat) {
        showNotification(
          'Error Validasi',
          `Material ID ${matId} tidak ditemukan.`,
          'error',
          'Outbound Delivery'
        );
        return;
      }
      if (totalQty > mat.currentStock) {
        showNotification(
          'Stok Tidak Cukup',
          `Stok fisik ${mat.namaBarang} tidak mencukupi. Tersedia: ${mat.currentStock} ${mat.satuan}, yang diajukan: ${totalQty} ${mat.satuan}.`,
          'error',
          'Outbound Delivery'
        );
        return;
      }
    }

    addOutbound({
      nomorDOSJ,
      customer,
      tanggal,
      ekspedisi,
      noKendaraan,
      palletOutCount: parseVal(palletOutCount),
      details: parsedDetails
    });

    setIsFormOpen(false);
    setNoKendaraan('');
  };

  const filteredOutbounds = outboundHeaders.filter(o => {
    if (o.isManual) return false;

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
    const rows = outboundHeaders.filter(o => !o.isManual).map(o => ({
      'Nomor DO/SJ': o.nomorDOSJ,
      'Tanggal': o.tanggal,
      'Customer': o.customer,
      'Ekspedisi': o.ekspedisi,
      'No Kendaraan': o.noKendaraan || '-',
      'Pallet Out': o.palletOutCount,
      'Jumlah SKU': o.details.length
    }));
    exportToExcel(rows, 'Laporan_Outbound_Delivery', 'Outbound');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span>Outbound Delivery (Pengiriman)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengeluaran Barang Dari Gudang Pancawati Ke Customer Seperti Sicom Dan PT MIM Dengan Regulasi Pengecekan Barang,Membuat Surat Jalan, Reservasi Sistem Dan Rekap Data Outbound.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Outbound</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Nomor DO/SJ, Customer, Ekspedisi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
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
                <th className="p-3.5">Nomor DO / SJ</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Customer / Tujuan</th>
                <th className="p-3.5">Ekspedisi</th>
                <th className="p-3.5">No. Kendaraan</th>
                <th className="p-3.5">Pallet OUT</th>
                <th className="p-3.5 text-center">Items</th>
                <th className="p-3.5 text-center">Aksi & Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOutbounds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Tidak ada transaksi pengiriman outbound.
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
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded">
                            {o.palletOutCount} Pallet
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{o.details.length}</td>
                        <td className="p-3.5 text-center space-x-2">
                          <button
                            onClick={() => generateSuratJalanPDF(o, appLogoUrl)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-all inline-flex items-center space-x-1 shadow-xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Surat Jalan PDF</span>
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
                          <td colSpan={8} className="p-4">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                              <h4 className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Rincian Barang Dikirim (DO: {o.nomorDOSJ})</span>
                              </h4>
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                                  <tr>
                                    <th className="p-2">Material ID</th>
                                    <th className="p-2">Nama Barang</th>
                                    <th className="p-2">Qty Pallet</th>
                                    <th className="p-2">Gedung Asal</th>
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
                                      <td className="p-2 font-bold text-amber-700">{d.jumlahPallet ?? 1} Pallet</td>
                                      <td className="p-2 font-medium text-slate-600">{d.gedungAsal || '-'}</td>
                                      <td className="p-2 font-bold text-indigo-600">{d.qty}</td>
                                      <td className="p-2 text-slate-500">{d.satuan}</td>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-800 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                <span>Form Outbound Delivery</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SJ</label>
                  <input
                    type="text"
                    required
                    value={nomorDOSJ}
                    onChange={e => setNomorDOSJ(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima</label>
                  <input
                    type="text"
                    required
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ekspedisi / Transport</label>
                  <input
                    type="text"
                    required
                    value={ekspedisi}
                    onChange={e => setEkspedisi(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Pallet OUT</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={palletOutCount}
                    onChange={e => setPalletOutCount(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Items Dikirim</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>                 <div className="space-y-3">
                  {details.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Pilih Material (Ketik / Cari)</label>
                        <MaterialSearchSelect
                          value={item.materialId}
                          onChange={val => handleMaterialChange(idx, val)}
                          materials={materials}
                          getMaterialStockByGedung={getMaterialStockByGedung}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Kirim</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.qty}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, qty: val as any } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Jumlah Pallet</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.jumlahPallet ?? 1}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, jumlahPallet: val as any } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="1"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Gedung Asal</label>
                        <select
                          value={item.gedungAsal || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDetails(prev => prev.map((d, i) => i === idx ? { ...d, gedungAsal: val } : d));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          {gedungList.map(g => {
                            const stockInGedung = getMaterialStockByGedung(item.materialId)[g.nama] || 0;
                            return (
                              <option key={g.id} value={g.nama}>
                                {g.nama} ({stockInGedung > 0 ? `Stok: ${stockInGedung}` : 'KOSONG'})
                              </option>
                            );
                          })}
                        </select>
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
                  Proses & Cetak Outbound
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
