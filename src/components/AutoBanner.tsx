import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Megaphone, 
  Volume2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Zap
} from 'lucide-react';
import { useWms } from '../context/WmsContext';

const DEFAULT_BANNER_TEXT = "📌 Operasional Gudang Sewa Pancawati Berjalan Normal • Pastikan Pencatatan Barang Masuk & Keluar Sesuai Prosedur K3 & SOP WMS Gudang";

const PRESET_MESSAGES = [
  "📌 Operasional Gudang Sewa Pancawati Berjalan Normal • Pastikan Pencatatan Barang Masuk & Keluar Sesuai Prosedur K3 & SOP WMS Gudang",
  "⚡ Jadwal Stock Opname Harian: Pastikan verifikasi fisik lokasi rak & gedung sesuai dengan data master.",
  "⚠️ Himbauan K3 & Keamanan: Seluruh staf shift wajib menggunakan APD lengkap, helm, dan sepatu safety.",
  "📦 Penerimaan Barang (Incoming): Selalu lakukan audit fisik & pengecekan kondisi pallet sebelum tandatangan SJ.",
  "🚚 Pengeluaran Barang (Outbound): Cek kembali Nomor DO, Plat Kendaraan, dan kelengkapan Surat Jalan Resmi."
];

export const AutoBanner: React.FC = () => {
  const { currentUser, autoBannerText, updateAutoBannerText } = useWms();
  const [time, setTime] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempText, setTempText] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save text via WmsContext
  const handleSaveText = () => {
    const trimmed = tempText.trim();
    if (trimmed) {
      updateAutoBannerText(trimmed);
    }
    setIsEditing(false);
  };

  const handleSelectPreset = (msg: string) => {
    updateAutoBannerText(msg);
    setIsEditing(false);
  };

  // Date Formatting in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = dayNames[time.getDay()];
  const dayNum = time.getDate();
  const monthName = monthNames[time.getMonth()];
  const year = time.getFullYear();

  const formattedDateString = `${dayName}, ${dayNum} ${monthName} ${year}`;
  
  // Hours, Minutes, Seconds formatting
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds} WIB`;

  // Determine Current Shift based on Hours
  const hourNum = time.getHours();
  let currentShift = 'Shift 1 (Pagi)';
  let shiftColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (hourNum >= 15 && hourNum < 23) {
    currentShift = 'Shift 2 (Sore)';
    shiftColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  } else if (hourNum >= 23 || hourNum < 7) {
    currentShift = 'Shift 3 (Malam)';
    shiftColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  }

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 shadow-md border border-indigo-500/30 relative overflow-hidden transition-all duration-300">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Flex Banner Row */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left Section: Hari & Tanggal + Real-Time Clock + Shift Badge */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Day & Date Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs font-bold text-white shadow-inner">
            <Calendar className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="tracking-wide">{formattedDateString}</span>
          </div>

          {/* Real-Time Digital Clock */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-400/30 text-xs font-mono font-bold text-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-300 animate-pulse shrink-0" />
            <span>{timeString}</span>
          </div>

          {/* Current Shift Tag */}
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${shiftColor}`}>
            <Activity className="w-3 h-3 shrink-0" />
            <span>{currentShift}</span>
          </div>

          {/* Live Status Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/30 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ONLINE WMS</span>
          </div>
        </div>

        {/* Center / Right Section: Teks Pengumuman Banner (Running Text Marquee) */}
        {!isMinimized && (
          <div className="flex-1 min-w-0 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2.5 shadow-inner overflow-hidden">
            <style>{`
              @keyframes wmsBannerMarquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-wms-marquee {
                animation: wmsBannerMarquee 28s linear infinite;
              }
              .animate-wms-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
            
            <div className="flex items-center space-x-2.5 min-w-0 flex-1 overflow-hidden relative">
              <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg shrink-0 border border-amber-500/30 z-10 bg-slate-900/90 shadow-sm">
                <Megaphone className="w-4 h-4 animate-bounce" />
              </div>
              
              <div className="hidden sm:flex items-center space-x-1 shrink-0 z-10 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-amber-300 font-bold text-[11px] whitespace-nowrap shadow-xs">
                <span>INFO:</span>
              </div>

              {/* Running Marquee Container */}
              <div className="overflow-hidden whitespace-nowrap w-full relative text-xs font-medium text-slate-100 py-0.5 cursor-default">
                <div className="inline-block whitespace-nowrap animate-wms-marquee">
                  <span className="inline-block pr-12 text-slate-100 font-medium tracking-wide">{autoBannerText}</span>
                  <span className="inline-block pr-12 text-slate-100 font-medium tracking-wide">{autoBannerText}</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => {
                setTempText(autoBannerText);
                setIsEditing(true);
              }}
              title="Ubah teks pengumuman banner"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold rounded-lg border border-white/15 transition-all shrink-0 flex items-center space-x-1 cursor-pointer z-10 shadow-sm"
            >
              <Edit3 className="w-3 h-3 text-indigo-300" />
              <span className="hidden sm:inline">Ubah Text</span>
            </button>
          </div>
        )}

        {/* Minimize / Expand Toggle Button */}
        <button
          onClick={() => setIsMinimized(prev => !prev)}
          title={isMinimized ? "Tampilkan Teks Informasi" : "Sembunyikan Teks Informasi"}
          className="self-end lg:self-center p-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs flex items-center space-x-1 shrink-0"
        >
          {isMinimized ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold">Tampilkan Text</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          )}
        </button>

      </div>

      {/* MODAL / POPOVER UNTUK MENGEDIT TEKS BANNER */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ubah Teks Informasi Banner</h3>
                  <p className="text-[11px] text-slate-400">Teks ini akan muncul otomatis di banner seluruh menu tampilan WMS.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teks Informasi Kustom
                </label>
                <textarea
                  rows={3}
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  placeholder="Ketik teks banner yang ingin ditampilkan..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Presets Quick Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                  Atau Pilih Templat Teks Cepat:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {PRESET_MESSAGES.map((msg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(msg)}
                      className="w-full text-left p-2.5 bg-slate-800/60 hover:bg-indigo-950/60 hover:border-indigo-500/50 border border-slate-800 rounded-xl text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer leading-snug"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveText}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Banner</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
