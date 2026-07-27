import React, { useState } from 'react';
import { ClipboardCheck, Plus, Search, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useWms } from '../context/WmsContext';

export const StockOpnameView: React.FC = () => {
  const { stockOpnames, materials, currentUser, addStockOpname, approveStockOpnameAdjustment } = useWms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [qtyFisik, setQtyFisik] = useState<string | number>(0);
  const [penyebab, setPenyebab] = useState('Perhitungan rutin stok harian');
  const [matSearch, setMatSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmingOpnameItem, setConfirmingOpnameItem] = useState<any | null>(null);

  const parseVal = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const clean = String(v).replace(/,/g, '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];

  const filteredMaterialsForSelect = materials.filter(m => {
    const term = matSearch.toLowerCase();
    return m.id.toLowerCase().includes(term) || m.namaBarang.toLowerCase().includes(term);
  });

  const handleOpenModal = () => {
    const defaultMat = materials[0];
    if (defaultMat) {
      setSelectedMaterialId(defaultMat.id);
      setQtyFisik(defaultMat.currentStock);
      setPenyebab('Sesuai perhitungan fisik harian');
      setMatSearch(`${defaultMat.id} - ${defaultMat.namaBarang}`);
    } else {
      setMatSearch('');
    }
    setIsModalOpen(true);
  };

  const handleMaterialSelect = (id: string) => {
    setSelectedMaterialId(id);
    const mat = materials.find(m => m.id === id);
    if (mat) {
      setQtyFisik(mat.currentStock);
      setMatSearch(`${mat.id} - ${mat.namaBarang}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    addStockOpname({
      materialId: selectedMaterial.id,
      namaBarang: selectedMaterial.namaBarang,
      qtySistem: selectedMaterial.currentStock,
      qtyFisik: parseVal(qtyFisik),
      penyebab,
      status: 'Belum Selesai',
      pic: currentUser.nama
    });

    setIsModalOpen(false);
  };

  const filteredOpnames = stockOpnames.filter(s =>
    s.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
    s.materialId.toLowerCase().includes(search.toLowerCase()) ||
    s.pic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span>Stock Opname Harian</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan hasil perhitungan stok fisik harian, analisis selisih (kurang/lebih), dan penyesuaian saldo.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Input Hasil Opname Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Material, PIC, atau Catatan Selisih..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Opname Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Material ID</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Qty Sistem</th>
                <th className="p-3.5">Qty Fisik</th>
                <th className="p-3.5">Selisih</th>
                <th className="p-3.5">Penyebab Selisih</th>
                <th className="p-3.5">PIC Stoker</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOpnames.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    Belum ada data perhitungan stock opname.
                  </td>
                </tr>
              ) : (
                filteredOpnames.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500">{s.tanggal}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{s.materialId}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{s.namaBarang}</td>
                    <td className="p-3.5 font-mono text-slate-600">{s.qtySistem}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{s.qtyFisik}</td>
                    <td className="p-3.5 font-bold">
                      {s.selisih === 0 ? (
                        <span className="text-emerald-600">0 (Match)</span>
                      ) : s.selisih > 0 ? (
                        <span className="text-indigo-600">+{s.selisih} (Lebih)</span>
                      ) : (
                        <span className="text-rose-600">{s.selisih} (Kurang)</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 italic max-w-[180px] truncate">{s.penyebab || '-'}</td>
                    <td className="p-3.5 text-slate-700">{s.pic}</td>
                    <td className="p-3.5">
                      {s.status === 'Selesai' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Adjusted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.status === 'Belum Selesai' && (
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => setConfirmingOpnameItem(s)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={currentUser.role !== 'Admin' ? 'Otoritas khusus Admin' : 'Terapkan penyesuaian stok sistem'}
                        >
                          Terapkan Stok Fisik
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INPUT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                <span>Input Perhitungan Stock Opname</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Material *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik ID atau nama material untuk mencari..."
                    value={matSearch}
                    onChange={e => {
                      setMatSearch(e.target.value);
                      setIsDropdownOpen(true);
                      // If matches exactly
                      const match = materials.find(m => `${m.id} - ${m.namaBarang}` === e.target.value || m.id === e.target.value);
                      if (match) {
                        setSelectedMaterialId(match.id);
                        setQtyFisik(match.currentStock);
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  {matSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMatSearch('');
                        setIsDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {filteredMaterialsForSelect.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 italic">Material tidak ditemukan</div>
                    ) : (
                      filteredMaterialsForSelect.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            handleMaterialSelect(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 text-xs transition-colors flex flex-col ${
                            selectedMaterialId === m.id ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <span className="font-semibold text-slate-900">{m.id} - {m.namaBarang}</span>
                          <span className="text-[10px] text-slate-500">Stok Sistem: {m.currentStock} {m.satuan} • Kategori: {m.kategori}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-indigo-600 font-semibold">Nama Barang: {selectedMaterial?.namaBarang || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Qty Di Sistem</label>
                  <input
                    type="number"
                    disabled
                    value={selectedMaterial?.currentStock || 0}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Fisik Hasil Hitung *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={qtyFisik}
                    onChange={e => setQtyFisik(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Real-time Selisih Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Hasil Selisih Variance:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded ${
                  parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) > 0 ? `+${parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0)} (Lebih)` : `${parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0)} (Kurang)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penyebab Selisih / Catatan</label>
                <textarea
                  rows={2}
                  value={penyebab}
                  onChange={e => setPenyebab(e.target.value)}
                  placeholder="e.g. Kerusakan kemasan saat penanganan, susut, dll."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan Stock Opname
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR STOCK ADJUSTMENT */}
      {confirmingOpnameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-slate-800">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Konfirmasi Adjustment</span>
              </h3>
              <button onClick={() => setConfirmingOpnameItem(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menyetujui penyesuaian stok sistem untuk <strong className="text-slate-800">{confirmingOpnameItem.namaBarang}</strong> ({confirmingOpnameItem.materialId})?
              </p>
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Qty Sistem saat ini:</span>
                  <span className="font-mono text-slate-700">{confirmingOpnameItem.qtySistem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Qty Fisik Aktual (Akan Diterapkan):</span>
                  <span className="font-mono font-bold text-emerald-600">{confirmingOpnameItem.qtyFisik}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-semibold">
                  <span className="text-slate-600">Selisih Variance:</span>
                  <span className={confirmingOpnameItem.selisih === 0 ? 'text-slate-600' : confirmingOpnameItem.selisih > 0 ? 'text-indigo-600' : 'text-rose-600'}>
                    {confirmingOpnameItem.selisih > 0 ? `+${confirmingOpnameItem.selisih}` : confirmingOpnameItem.selisih}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingOpnameItem(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    approveStockOpnameAdjustment(confirmingOpnameItem.id);
                    setConfirmingOpnameItem(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Ya, Setujui & Update Saldo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
