import React, { useState } from 'react';
import { UserCheck, Lock, Check, Boxes, User } from 'lucide-react';
import { useWms } from '../context/WmsContext';

export const LoginView: React.FC = () => {
  const { users, currentUser, setCurrentUser, setIsLoggedIn, showNotification, appLogoUrl, appTitle } = useWms();
  const [inputUsername, setInputUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) {
      showNotification('Input Kosong', 'Silakan masukkan Username atau NIK Anda.', 'warning', 'Autentikasi');
      return;
    }
    if (!password) {
      showNotification('Input Kosong', 'Silakan masukkan kata sandi Anda.', 'warning', 'Autentikasi');
      return;
    }

    const trimmedUsername = inputUsername.trim().toLowerCase();
    const userToLogin = users.find(u => 
      u.username.toLowerCase() === trimmedUsername || 
      u.id.toLowerCase() === trimmedUsername
    );

    if (userToLogin) {
      const correctPassword = userToLogin.password || '123456';
      if (password !== correctPassword) {
        showNotification('Login Gagal', 'Kata sandi yang Anda masukkan salah.', 'error', 'Autentikasi');
        return;
      }

      setCurrentUser(userToLogin);
      setShowSuccess(true);
      setTimeout(() => {
        setIsLoggedIn(true);
        setShowSuccess(false);
        showNotification(
          'Login Berhasil', 
          `Selamat datang kembali, ${userToLogin.nama}! Anda masuk sebagai ${userToLogin.role}.`, 
          'success', 
          'Autentikasi'
        );
      }, 600);
    } else {
      showNotification('Login Gagal', 'Username atau NIK tidak ditemukan dalam sistem.', 'error', 'Autentikasi');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-y-auto">
      
      {/* Background Warehouse Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000')`
        }}
      />

      {/* Dark Overlay for High Contrast */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-slate-950/80 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col my-auto animate-fade-in">
        
        {/* Top Header Section */}
        <div className="px-6 py-6 bg-slate-50/80 border-b border-slate-200/80 flex flex-col items-center text-center">
          {/* Company Logo White Container */}
          <div className="mb-3.5 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-md ring-4 ring-indigo-50/60 flex items-center justify-center transition-all">
            {appLogoUrl ? (
              <img 
                src={appLogoUrl} 
                alt="Logo WMS" 
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain" 
              />
            ) : (
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
                <Boxes className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
            )}
          </div>

          <h2 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
            {appTitle || 'WMS Gudang'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Sistem Manajemen Gudang Sewa Pancawati
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          
          {/* Username / NIK Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username atau NIK *
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputUsername}
                onChange={e => setInputUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                placeholder="Masukkan username atau NIK (misal: admin, USR-1)"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer focus:outline-none"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                placeholder="Masukkan kata sandi..."
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            {showSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Login Berhasil...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Footer copyright */}
      <div className="text-slate-300/90 text-[11px] font-medium text-center mt-6 z-10 drop-shadow-xs">
        &copy; {new Date().getFullYear()} {appTitle || 'WMS Gudang'} • Powered By Hasan Hariri
      </div>

    </div>
  );
};
