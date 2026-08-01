import React, { useState } from 'react';
import { MapPin, Layers, Boxes, Info, CheckCircle, MoveRight } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { Gedung } from '../types';
import { calculatePalletCount, getUppPalletForMaterial } from '../utils/palletUtils';

export const WarehouseLayoutView: React.FC = () => {
  const { gedungList, materials, getMaterialStockByGedung } = useWms();
  const [selectedGedung, setSelectedGedung] = useState<Gedung | null>(gedungList[0] || null);

  // Helper to calculate total pallets stored in a Gedung based on stock & UPP Pallet
  const getGedungCalculatedPallets = (gNama: string) => {
    let totalPallets = 0;
    materials.forEach(m => {
      const bStocks = getMaterialStockByGedung(m.id);
      const stockInBuilding = bStocks[gNama] || 0;
      if (stockInBuilding > 0) {
        totalPallets += calculatePalletCount(stockInBuilding, m.id, materials);
      }
    });
    return totalPallets;
  };

  // Filter materials stored in selected Gedung with stock > 0 in this Gedung
  const storedMaterials: { id: string; namaBarang: string; currentStock: number; buildingStock: number; satuan: string; kategori: string; uppPallet: number; itemPallets: number }[] = [];

  if (selectedGedung) {
    materials.forEach(m => {
      const bStocks = getMaterialStockByGedung(m.id);
      const stockInBuilding = bStocks[selectedGedung.nama] || 0;
      if (stockInBuilding > 0) {
        const itemPallets = calculatePalletCount(stockInBuilding, m.id, materials);
        const upp = getUppPalletForMaterial(m.id, materials);
        storedMaterials.push({
          id: m.id,
          namaBarang: m.namaBarang,
          currentStock: m.currentStock,
          buildingStock: stockInBuilding,
          satuan: m.satuan,
          kategori: m.kategori,
          uppPallet: upp,
          itemPallets
        });
      }
    });
  }

  const getOccupancyColor = (terisi: number, kapasitas: number) => {
    const ratio = terisi / kapasitas;
    if (ratio >= 0.85) return { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200', status: 'Hampir Penuh' };
    if (ratio >= 0.60) return { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200', status: 'Terisi Sedang' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', status: 'Kapasitas Longgar' };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <span>Warehouse Layout Gudang Pancawati</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi Zona Penyimpanan Barang & Status Occupancy Pallet Real-Time.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-600">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <span>Low (&lt;60%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
            <span>Med (60-85%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
            <span>High (&gt;85%)</span>
          </div>
        </div>
      </div>

      {/* VISUAL DENAH GRID (10 GEDUNG REQUIREMENT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Peta Denah Gudang (Klik Gedung Untuk Detail)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {gedungList.map(g => {
            const isSelected = selectedGedung?.id === g.id;
            const calcPallets = getGedungCalculatedPallets(g.nama);
            const displayTerisi = Math.max(g.palletTerisi, calcPallets);
            const pct = Math.round((displayTerisi / g.kapasitasPallet) * 100);
            const occ = getOccupancyColor(displayTerisi, g.kapasitasPallet);

            // Calculate total physical stock & SKU count stored in this gedung
            let totalBuildingQty = 0;
            let totalBuildingSkus = 0;
            materials.forEach(m => {
              const bStocks = getMaterialStockByGedung(m.id);
              const qtyInG = bStocks[g.nama] || 0;
              if (qtyInG > 0) {
                totalBuildingQty += qtyInG;
                totalBuildingSkus += 1;
              }
            });

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGedung(g)}
                className={`
                  p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[155px]
                  ${isSelected 
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20 scale-[1.02]' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'}
                `}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">{g.nama}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${occ.badge}`}>
                    {pct}%
                  </span>
                </div>

                {/* Subtitle Zone & Stats */}
                <div>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{g.zona}</p>
                  <p className="text-[10px] text-indigo-700 font-bold mt-1">
                    {totalBuildingQty.toLocaleString('id-ID')} items <span className="text-slate-400 font-normal">({totalBuildingSkus} SKU)</span>
                  </p>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Terisi: {displayTerisi} Pallet</span>
                    <span>Max: {g.kapasitasPallet}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${occ.bg} transition-all duration-500`} 
                      style={{ width: `${Math.min(100, pct)}%` }} 
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED BUILDING DETAIL PANEL */}
      {selectedGedung && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedGedung.nama}</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  {selectedGedung.zona}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedGedung.deskripsi}</p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-500">Total Stok Fisik</p>
                <p className="text-sm font-bold text-indigo-700">
                  {storedMaterials.reduce((sum, item) => sum + item.buildingStock, 0).toLocaleString('id-ID')} items
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-500">Total Kapasitas</p>
                <p className="text-sm font-bold text-slate-900">{selectedGedung.kapasitasPallet} Pallet</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-500">Pallet Terpakai</p>
                <p className="text-sm font-bold text-emerald-600">
                  {Math.max(selectedGedung.palletTerisi, getGedungCalculatedPallets(selectedGedung.nama))} Pallet
                </p>
              </div>
            </div>
          </div>

          {/* Stored Material Preview in this Building */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Barang Tersimpan Di {selectedGedung.nama}
            </h4>
            {storedMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {storedMaterials.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.namaBarang}</p>
                      <p className="text-[10px] text-slate-500">
                        {m.id} • <span className="font-semibold text-indigo-600">{m.buildingStock} {m.satuan}</span>
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        ~{m.itemPallets} Pallet <span className="text-slate-400 font-normal">(UPP: {m.uppPallet})</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Tidak ada barang dengan stok aktif yang tersimpan di {selectedGedung.nama}.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
