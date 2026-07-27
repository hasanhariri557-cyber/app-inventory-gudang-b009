import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownLeft, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, Search, Layers, FileText, ChevronDown, Check } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { IncomingDetail, IncomingHeader, Material } from '../types';

interface MaterialSearchSelectProps {
  selectedId: string;
  materials: Material[];
  onSelect: (matId: string) => void;
}

const MaterialSearchSelect: React.FC<MaterialSearchSelectProps> = ({ selectedId, materials, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMaterial = materials.find(m => m.id === selectedId);

  const filteredMaterials = materials.filter(m => 
    m.id.toLowerCase().includes(query.toLowerCase()) ||
    m.namaBarang.toLowerCase().includes(query.toLowerCase()) ||
    m.kategori.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 flex items-center justify-between font-medium cursor-pointer shadow-2xs transition-all text-left"
      >
        <span className="truncate pr-2">
          {selectedMaterial ? (
            <span className="flex items-center space-x-1.5 truncate">
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded text-[10px] font-bold shrink-0">
                {selectedMaterial.id}
              </span>
              <span className="truncate text-slate-900 font-semibold">{selectedMaterial.namaBarang}</span>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">({selectedMaterial.satuan})</span>
            </span>
          ) : (
            <span className="text-slate-400">Pilih Material...</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari ID, nama, atau kategori material..."
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 space-y-0.5">
            {filteredMaterials.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 italic">
                Material &quot;{query}&quot; tidak ditemukan
              </div>
            ) : (
              filteredMaterials.map(m => {
                const isSelected = m.id === selectedId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelect(m.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col pr-2 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1 py-0.2 rounded shrink-0">
                          {m.id}
                        </span>
                        <span className="truncate font-semibold text-slate-900">{m.namaBarang}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 pl-0.5">
                        {m.kategori} • Satuan: {m.satuan} • Stok: {m.currentStock}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const IncomingView: React.FC = () => {
  const { incomingHeaders, materials, vendors, gedungList, addIncoming } = useWms();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Header Form State
  const today = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(today);
  const [vendor, setVendor] = useState(vendors[0]?.namaVendor || 'PT Mitra Packaging Nusantara');
  const [nomorPO, setNomorPO] = useState('PO');
  const [noSuratJalan, setNoSuratJalan] = useState('SJ');
  const [platKendaraan, setPlatKendaraan] = useState('');
  const [palletInCount, setPalletInCount] = useState<number>(10);

  // Details Form State
  const [details, setDetails] = useState<Omit<IncomingDetail, 'id'>[]>([
    {
      materialId: materials[0]?.id || '14000049',
      namaBarang: materials[0]?.namaBarang || 'ANTIBAC014L',
      qtySuratJalan: 500,
      qtyReject: 0,
      qtyDiterima: 500,
      lokasiSimpan: 'Gedung B1',
      status: 'Good Receiving',
      alasanReject: ''
    }
  ]);

  const handleAddLineItem = () => {
    const defaultMat = materials[0];
    setDetails(prev => [
      ...prev,
      {
        materialId: defaultMat?.id || '14000049',
        namaBarang: defaultMat?.namaBarang || 'ANTIBAC014L',
        qtySuratJalan: 100,
        qtyReject: 0,
        qtyDiterima: 100,
        lokasiSimpan: 'Gedung A1',
        status: 'Good Receiving',
        alasanReject: ''
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (details.length > 1) {
      setDetails(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const selected = materials.find(m => m.id === matId);
    if (!selected) return;

    setDetails(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          materialId: selected.id,
          namaBarang: selected.namaBarang,
          lokasiSimpan: selected.lokasiDefaut || 'Gedung A1'
        };
      }
      return item;
    }));
  };

  const handleQtyChange = (index: number, field: 'qtySuratJalan' | 'qtyReject', val: string | number) => {
    setDetails(prev => prev.map((item, i) => {
      if (i === index) {
        const qtySJ = field === 'qtySuratJalan' ? val : item.qtySuratJalan;
        const qtyRej = field === 'qtyReject' ? val : item.qtyReject;
        
        const parseVal = (v: any) => {
          if (typeof v === 'number') return v;
          if (!v) return 0;
          const clean = String(v).replace(/,/g, '.');
          const parsed = parseFloat(clean);
          return isNaN(parsed) ? 0 : parsed;
        };

        const qtySJNum = parseVal(qtySJ);
        const qtyRejNum = parseVal(qtyRej);
        const qtyRec = Math.max(0, qtySJNum - qtyRejNum);
        
        let autoStatus: IncomingDetail['status'] = 'Good Receiving';
        if (qtyRejNum > 0 && qtyRec > 0) autoStatus = 'Good Receiving';
        else if (qtyRejNum > 0 && qtyRec === 0) autoStatus = 'Rejected';

        return {
          ...item,
          qtySuratJalan: qtySJ as any,
          qtyReject: qtyRej as any,
          qtyDiterima: qtyRec,
          status: autoStatus
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
      id: `INCD-${Date.now()}-${i}`,
      qtySuratJalan: parseVal(d.qtySuratJalan),
      qtyReject: parseVal(d.qtyReject),
      qtyDiterima: parseVal(d.qtyDiterima),
    }));

    addIncoming({
      tanggal,
      vendor,
      nomorPO,
      noSuratJalan,
      platKendaraan,
      palletInCount: parseVal(palletInCount),
      details: parsedDetails
    });

    setIsFormOpen(false);
  };

  const filteredHeaders = incomingHeaders.filter(h => 
    h.noReceiving.toLowerCase().includes(search.toLowerCase()) ||
    h.noSuratJalan.toLowerCase().includes(search.toLowerCase()) ||
    h.vendor.toLowerCase().includes(search.toLowerCase()) ||
    h.nomorPO.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span>Incoming Barang (Receiving)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerimaan barang masuk dari vendor, proses good receive, dan alokasi barang.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Input Receiving Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Vendor, PO, atau Surat Jalan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Incoming Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">No PO</th>
                <th className="p-3.5">No Surat Jalan</th>
                <th className="p-3.5">Plat Kendaraan</th>
                <th className="p-3.5">Pallet IN</th>
                <th className="p-3.5 text-center">Items</th>
                <th className="p-3.5 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHeaders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Tidak ada transaksi receiving ditemukan.
                  </td>
                </tr>
              ) : (
                filteredHeaders.map(h => {
                  const isExpanded = expandedId === h.id;
                  return (
                    <React.Fragment key={h.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-slate-600 font-medium">{h.tanggal}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{h.vendor}</td>
                        <td className="p-3.5 text-slate-500 font-mono">{h.nomorPO}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{h.noSuratJalan}</td>
                        <td className="p-3.5 font-mono text-slate-500">{h.platKendaraan}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded">
                            {h.palletInCount} Pallet
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{h.details.length}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : h.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-all"
                          >
                            {isExpanded ? 'Sembunyikan' : 'Lihat Detail'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-table for Items */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="p-4">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                              <h4 className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Rincian Detail Barang Receiving</span>
                              </h4>
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                                  <tr>
                                    <th className="p-2">Material ID</th>
                                    <th className="p-2">Nama Barang</th>
                                    <th className="p-2">Qty SJ</th>
                                    <th className="p-2">Qty Reject</th>
                                    <th className="p-2">Qty Diterima</th>
                                    <th className="p-2">Lokasi Simpan</th>
                                    <th className="p-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {h.details.map((d, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2 font-mono text-indigo-600 font-bold">{d.materialId}</td>
                                      <td className="p-2 font-medium text-slate-900">{d.namaBarang}</td>
                                      <td className="p-2 text-slate-500">{d.qtySuratJalan}</td>
                                      <td className="p-2 font-bold text-rose-600">{d.qtyReject}</td>
                                      <td className="p-2 font-bold text-emerald-600">{d.qtyDiterima}</td>
                                      <td className="p-2 font-medium text-slate-700">{d.lokasiSimpan}</td>
                                      <td className="p-2">
                                        {d.status === 'Good Receiving' ? (
                                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">Good Receiving</span>
                                        ) : d.status === 'Tolak' ? (
                                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">Tolak Partial</span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">Rejected</span>
                                        )}
                                      </td>
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

      {/* NEW RECEIVING FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>Form Input Receiving Barang Masuk</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              
              {/* Header Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Receiving</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Vendor</label>
                  <select
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.namaVendor}>{v.namaVendor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor PO Pembelian</label>
                  <input
                    type="text"
                    required
                    value={nomorPO}
                    onChange={e => setNomorPO(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No Surat Jalan Vendor</label>
                  <input
                    type="text"
                    required
                    value={noSuratJalan}
                    onChange={e => setNoSuratJalan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plat Kendaraan Truk</label>
                  <input
                    type="text"
                    required
                    value={platKendaraan}
                    onChange={e => setPlatKendaraan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Pallet IN</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={palletInCount}
                    onChange={e => setPalletInCount(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Items Detail Table Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Items Barang</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Barang</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {details.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Pilih Material</label>
                          <MaterialSearchSelect
                            selectedId={item.materialId}
                            materials={materials}
                            onSelect={matId => handleMaterialChange(idx, matId)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Surat Jalan</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.qtySuratJalan}
                            onChange={e => handleQtyChange(idx, 'qtySuratJalan', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Reject / Kurang</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.qtyReject}
                            onChange={e => handleQtyChange(idx, 'qtyReject', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 font-bold focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[11px] text-slate-500">Qty Diterima (Bersih): </span>
                          <span className="text-xs font-bold text-emerald-700">{item.qtyDiterima} Unit</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Lokasi Simpan Target</label>
                          <select
                            value={item.lokasiSimpan}
                            onChange={e => {
                              const val = e.target.value;
                              setDetails(prev => prev.map((d, i) => i === idx ? { ...d, lokasiSimpan: val } : d));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                          >
                            {gedungList.map(g => (
                              <option key={g.id} value={g.nama}>{g.nama} ({g.zona})</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          {item.qtyReject > 0 && (
                            <input
                              type="text"
                              placeholder="Alasan Reject..."
                              value={item.alasanReject}
                              onChange={e => {
                                const val = e.target.value;
                                setDetails(prev => prev.map((d, i) => i === idx ? { ...d, alasanReject: val } : d));
                              }}
                              className="bg-white border border-rose-300 rounded-lg px-2 py-1 text-xs text-rose-700 w-full mr-2"
                            />
                          )}

                          {details.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Proses & Simpan Receiving
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
