import React, { useState, useEffect } from 'react';
import { useWms } from '../context/WmsContext';
import { DriverQueueItem } from '../types';
import { Truck, CheckCircle2, RefreshCw, ClipboardList, User, ShieldCheck, ArrowRight, LogOut, Navigation, Phone, Package } from 'lucide-react';

export const DriverCheckinView: React.FC = () => {
  const { driverQueues, registerDriverQueue, appTitle, jenisBarangOptions } = useWms();

  // Active registration session stored in localStorage to persist on refresh
  const [activeQueueId, setActiveQueueId] = useState<string | null>(() => {
    return localStorage.getItem('active_driver_queue_id');
  });

  // Form states
  const [platNomor, setPlatNomor] = useState('');
  const [namaSupir, setNamaSupir] = useState('');
  const [namaVendor, setNamaVendor] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jenisBarang, setJenisBarang] = useState('');
  const [customJenisBarang, setCustomJenisBarang] = useState('');
  const [aktivitas, setAktivitas] = useState<'Bongkar' | 'Muat'>('Bongkar');

  useEffect(() => {
    const draft = { platNomor, namaSupir, namaVendor, noHp, jenisBarang, customJenisBarang, aktivitas };
    localStorage.setItem('DRIVER_CHECKIN_DRAFT', JSON.stringify(draft));
  }, [platNomor, namaSupir, namaVendor, noHp, jenisBarang, customJenisBarang, aktivitas]);

  useEffect(() => {
    const saved = localStorage.getItem('DRIVER_CHECKIN_DRAFT');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPlatNomor(parsed.platNomor || '');
      setNamaSupir(parsed.namaSupir || '');
      setNamaVendor(parsed.namaVendor || '');
      setNoHp(parsed.noHp || '');
      setJenisBarang(parsed.jenisBarang || '');
      setCustomJenisBarang(parsed.customJenisBarang || '');
      setAktivitas(parsed.aktivitas || 'Bongkar');
    }
  }, []);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Find active queue item from real-time context
  const activeQueueItem = driverQueues.find(q => q.id === activeQueueId);

  // If active queue id exists but item is not in the list (e.g. deleted), clear it
  useEffect(() => {
    if (activeQueueId && driverQueues.length > 0 && !activeQueueItem) {
      // Don't clear immediately, wait in case it's still loading from Firestore
      const timer = setTimeout(() => {
        const checkStillMissing = !driverQueues.some(q => q.id === activeQueueId);
        if (checkStillMissing) {
          localStorage.removeItem('active_driver_queue_id');
          setActiveQueueId(null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeQueueId, driverQueues, activeQueueItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalJenisBarang = jenisBarang === 'Lainnya' ? customJenisBarang : jenisBarang;

    if (!platNomor.trim() || !namaSupir.trim() || !namaVendor.trim() || !noHp.trim() || !finalJenisBarang.trim()) {
      setErrorMessage('Semua kolom pendaftaran wajib diisi secara lengkap.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find if this plate is already in "Menunggu", "Dipanggil", or "Bongkar Muat" status for today
      const cleanPlate = platNomor.replace(/\s+/g, '').toUpperCase();
      const todayStr = new Date().toISOString().split('T')[0];
      const isAlreadyQueued = driverQueues.some(q => {
        const qDate = (q.tanggalDaftar || '').split('T')[0];
        return (
          qDate === todayStr &&
          q.platNomor.replace(/\s+/g, '').toUpperCase() === cleanPlate && 
          q.status !== 'Selesai'
        );
      });

      if (isAlreadyQueued) {
        setErrorMessage(`Plat Kendaraan ${platNomor.toUpperCase()} sedang dalam antrean aktif.`);
        setIsSubmitting(false);
        return;
      }

      // Register
      const nextQueueNum = await registerDriverQueue({
        platNomor: platNomor.toUpperCase(),
        namaSupir,
        namaVendor,
        noHp,
        jenisBarang: finalJenisBarang,
        aktivitas
      });

      // Find the created item to get its ID
      // Since context is updated, we find the item matching our inputs
      const createdItem = driverQueues.find(q => 
        q.platNomor.toUpperCase() === platNomor.toUpperCase() && 
        q.namaSupir === namaSupir &&
        q.status === 'Menunggu'
      );

      const idToStore = createdItem?.id || `dq_${Date.now()}`;
      localStorage.setItem('active_driver_queue_id', idToStore);
      setActiveQueueId(idToStore);

      // Reset form
      setPlatNomor('');
      setNamaSupir('');
      setNamaVendor('');
      setNoHp('');
      setJenisBarang('');
      setCustomJenisBarang('');
      setAktivitas('Bongkar');
      localStorage.removeItem('DRIVER_CHECKIN_DRAFT');
    } catch (err) {
      setErrorMessage('Gagal mendaftarkan antrean. Silakan coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('active_driver_queue_id');
    setActiveQueueId(null);
    setErrorMessage(null);
  };

  // Calculate position in queue
  const getQueuePosition = () => {
    if (!activeQueueItem || activeQueueItem.status !== 'Menunggu') return 0;
    
    // Count how many "Menunggu" items are before this item (registered earlier)
    const position = driverQueues
      .filter(q => q.status === 'Menunggu' && q.tanggalDaftar < activeQueueItem.tanggalDaftar)
      .length;
      
    return position + 1;
  };

  const aheadCount = getQueuePosition() - 1;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      
      {/* Mini Header / Brand */}
      <header className="w-full max-w-md mx-auto pt-4 pb-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">{appTitle || 'WMS GUDANG'}</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gate & Yard Management</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ONLINE
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto py-8 flex flex-col justify-center">
        
        {!activeQueueId || !activeQueueItem ? (
          /* REGISTRATION FORM */
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pendaftaran Supir</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Silakan isi data kendaraan dan vendor untuk mendapatkan nomor antrean bongkar muat.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Jenis Aktivitas Segmented Button */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Jenis Aktivitas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAktivitas('Bongkar')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aktivitas === 'Bongkar'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">BONGKAR BARANG</span>
                    <span className="font-extrabold text-xs">Incoming / Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAktivitas('Muat')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aktivitas === 'Muat'
                        ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">MUAT BARANG</span>
                    <span className="font-extrabold text-xs">Outbound / Keluar</span>
                  </button>
                </div>
              </div>

              {/* Plat Kendaraan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Plat Nomor Kendaraan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 1234 CD"
                    value={platNomor}
                    onChange={(e) => setPlatNomor(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase transition-all duration-200"
                  />
                </div>
              </div>

              {/* Nama Supir */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Lengkap Supir</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama supir"
                    value={namaSupir}
                    onChange={(e) => setNamaSupir(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Nama Vendor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Perusahaan / Vendor</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama perusahaan"
                    value={namaVendor}
                    onChange={(e) => setNamaVendor(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* No HP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">No. HP / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Jenis Barang */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Jenis Barang Bawaan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <select
                    required
                    value={jenisBarang}
                    onChange={(e) => {
                      setJenisBarang(e.target.value);
                      if (e.target.value !== 'Lainnya') {
                        setCustomJenisBarang('');
                      }
                    }}
                    className="block w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-500">-- Pilih Jenis Barang --</option>
                    {(jenisBarangOptions || []).map(opt => (
                      <option key={opt.id} value={opt.nama} className="text-slate-900 bg-white">{opt.nama}</option>
                    ))}
                    <option value="Lainnya" className="text-slate-900 bg-white">Lainnya (Ketik Manual)...</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {jenisBarang === 'Lainnya' && (
                  <div className="mt-2.5 space-y-1 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Ketik Jenis Barang Manual</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pallet Kayu, Roll Film, dll."
                      value={customJenisBarang}
                      onChange={(e) => setCustomJenisBarang(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 border border-indigo-300 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    Ambil Nomor Antrean
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 justify-center text-[11px] text-slate-500 bg-slate-950/30 p-3 rounded-2xl border border-slate-850">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sistem pendaftaran ini terintegrasi langsung dengan WMS Pos Logistik Utama.</span>
            </div>
          </div>
        ) : (
          /* QUEUE TICKET ACTIVE SESSION */
          <div className="space-y-6">
            
            {/* Visual Card Ticket */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-indigo-950/5 overflow-hidden relative">
              
              {/* Decorative line circles */}
              <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white border-r border-slate-200 -translate-y-1/2"></div>
              <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border-l border-slate-200 -translate-y-1/2"></div>
              
              {/* Top part */}
              <div className="p-6 text-center border-b border-dashed border-slate-200 pb-8">
                <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-1.5">Tiket Antrean Supir</p>
                <h3 className="text-7xl font-black text-slate-900 tracking-tighter my-2 drop-shadow-sm">{activeQueueItem.noAntrian}</h3>
                
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Status Anda:</span>
                  <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                    activeQueueItem.status === 'Menunggu' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    activeQueueItem.status === 'Dipanggil' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    activeQueueItem.status === 'Bongkar Muat' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activeQueueItem.status === 'Dipanggil' ? 'Dipanggil ke Dock' : activeQueueItem.status}
                  </span>
                </div>
              </div>

              {/* Bottom part */}
              <div className="p-6 pt-8 space-y-4">
                
                 {/* Meta details */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                  <div className="col-span-2 pb-2 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Jenis Aktivitas</span>
                      <span className={`text-xs font-black uppercase ${activeQueueItem.aktivitas === 'Muat' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {activeQueueItem.aktivitas === 'Muat' ? 'MUAT BARANG (Outbound)' : 'BONGKAR BARANG (Incoming)'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeQueueItem.aktivitas === 'Muat' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {activeQueueItem.aktivitas === 'Muat' ? 'MUAT' : 'BONGKAR'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Supir</span>
                    <span className="font-bold text-slate-900 truncate block">{activeQueueItem.namaSupir}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Plat Nomor</span>
                    <span className="font-bold text-slate-900 truncate block uppercase">{activeQueueItem.platNomor}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Vendor / Ekspedisi</span>
                    <span className="font-bold text-slate-900 truncate block">{activeQueueItem.namaVendor}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">No. HP</span>
                    <span className="font-bold text-slate-900 truncate block">{activeQueueItem.noHp}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Jenis Barang</span>
                    <span className="font-bold text-slate-900 truncate block">{activeQueueItem.jenisBarang}</span>
                  </div>
                </div>

                {/* Live Position Ahead */}
                {activeQueueItem.status === 'Menunggu' && (
                  <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                    <p className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider mb-0.5">Posisi Antrean</p>
                    <p className="text-sm font-bold text-slate-900">
                      {aheadCount > 0 ? (
                        <>Ada <span className="text-lg text-indigo-700 font-black px-1">{aheadCount}</span> truk sebelum Anda</>
                      ) : (
                        <span className="text-emerald-700 font-black text-xs uppercase tracking-wide">Truk Anda di baris antrean berikutnya!</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Guidance description */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 text-xs leading-relaxed text-slate-700">
                  <div className="p-1 bg-indigo-100 text-indigo-600 rounded-xl h-fit">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-0.5">Petunjuk Operasional:</p>
                    {activeQueueItem.status === 'Menunggu' && (
                      <p className="text-slate-600 text-[11px]">Silakan parkir dengan tertib di area yard yang ditentukan. Halaman ini akan diperbarui secara real-time saat Anda dipanggil.</p>
                    )}
                    {activeQueueItem.status === 'Dipanggil' && (
                      <p className="text-blue-700 font-semibold text-[11px] animate-pulse">Panggilan Masuk! Silakan segera arahkan truk Anda menuju pintu gerbang docking penerimaan barang.</p>
                    )}
                    {activeQueueItem.status === 'Bongkar Muat' && (
                      <p className="text-orange-700 font-semibold text-[11px]">Proses Bongkar Muat Sedang Berlangsung. Mohon tetap berada di luar kabin dan utamakan keselamatan kerja K3.</p>
                    )}
                    {activeQueueItem.status === 'Selesai' && (
                      <p className="text-emerald-700 font-semibold text-[11px]">Bongkar muat selesai! Silakan ambil dokumen tanda terima di pos, lalu keluar gate secara tertib. Terima kasih!</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Reset / Leave queue visual options */}
            <div className="flex gap-2.5">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                Daftar Antrean Baru
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-md mx-auto pt-6 pb-2 text-center text-[10px] text-slate-500 font-medium">
        <p>© 2026 POS LOGISTIK INDONESIA • GATE & YARD MANAGEMENT SYSTEM</p>
        <p className="mt-0.5 text-slate-500">Real-time status updates via Firestore Reactive OnSnapshot</p>
      </footer>

    </div>
  );
};
