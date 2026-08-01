import React, { useState } from 'react';
import { Repeat, Plus, Search, MapPin, ArrowRight } from 'lucide-react';
import { useWms } from '../context/WmsContext';

export const MutasiView: React.FC = () => {
  const { mutasis, materials, gedungList, currentUser, addMutasi, getMaterialStockByGedung } = useWms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [materialId, setMaterialId] = useState(materials[0]?.id || '');
  const [dari, setDari] = useState('Gedung A1');
  const [ke, setKe] = useState('Gedung E1');
  const [qty, setQty] = useState<string | number>(50);
  const [catatan, setCatatan] = useState('Mutasi internal antar gedung');

  const parseVal = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const clean = String(v).replace(/,/g, '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const selectedMat = materials.find(m => m.id === materialId) || materials[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMat) return;

    addMutasi({
      materialId: selectedMat.id,
      namaBarang: selectedMat.namaBarang,
      dari,
      ke,
      qty: parseVal(qty),
      pic: currentUser.nama,
      catatan
    });

    setIsModalOpen(false);
  };

  const filteredMutasi = mutasis.filter(m =>
    m.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
    m.materialId.toLowerCase().includes(search.toLowerCase()) ||
    m.dari.toLowerCase().includes(search.toLowerCase()) ||
    m.ke.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <span>Mutasi Barang (Riwayat Perpindahan)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log riwayat perpindahan posisi barang dari asal (lokasi awal) ke lokasi tujuan dalam gudang.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Input Mutasi Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Material, Lokasi Dari/Ke, PIC..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Material ID</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Dari (Asal)</th>
                <th className="p-3.5">Ke (Tujuan)</th>
                <th className="p-3.5">Qty</th>
                <th className="p-3.5">PIC Stoker</th>
                <th className="p-3.5">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutasi.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Belum ada catatan mutasi barang.
                  </td>
                </tr>
              ) : (
                filteredMutasi.map((m, idx) => (
                  <tr key={`${m.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500">{m.tanggal}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{m.materialId}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{m.namaBarang}</td>
                    <td className="p-3.5 text-rose-600 font-medium">{m.dari}</td>
                    <td className="p-3.5 text-emerald-600 font-medium">{m.ke}</td>
                    <td className="p-3.5 font-bold text-indigo-600">{m.qty} Unit</td>
                    <td className="p-3.5 text-slate-700">{m.pic}</td>
                    <td className="p-3.5 text-slate-500 italic">{m.catatan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Repeat className="w-5 h-5 text-indigo-600" />
                <span>Form Input Mutasi Barang</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Material *</label>
                <select
                  value={materialId}
                  onChange={e => setMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {materials.map((m, idx) => (
                    <option key={`${m.id}-${idx}`} value={m.id}>{m.id} - {m.namaBarang} ({m.currentStock} {m.satuan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Lokasi Asal *</label>
                  <select
                    value={dari}
                    onChange={e => setDari(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {gedungList.map((g, gIdx) => {
                      const stockInGedung = selectedMat ? (getMaterialStockByGedung(selectedMat.id)[g.nama] || 0) : 0;
                      return (
                        <option key={`${g.id}-${gIdx}`} value={g.nama}>
                          {g.nama} ({stockInGedung > 0 ? `Stok: ${stockInGedung}` : 'KOSONG'})
                        </option>
                      );
                    })}
                    <option value="Area Receiving Staging">Area Receiving Staging</option>
                    <option value="Area Outbound Staging">Area Outbound Staging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ke Lokasi Tujuan *</label>
                  <select
                    value={ke}
                    onChange={e => setKe(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {gedungList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                    <option value="Area Outbound Staging">Area Outbound Staging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Dipindahkan *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Mutasi</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="e.g. Penataan ulang rak"
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
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
