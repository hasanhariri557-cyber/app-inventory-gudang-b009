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
    <div className="min-h-screen min-h-dvh w-full bg-slate-950 flex flex-col items-center justify-between sm:justify-center p-3 sm:p-6 select-none relative overflow-y-auto">
      
      {/* Background Warehouse Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000')`
        }}
      />

      {/* Dark Overlay for High Contrast */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-slate-950/85 pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col my-auto animate-fade-in">
        
        {/* Top Header Section */}
        <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-50 border-b border-slate-200 flex flex-col items-center text-center">
          {/* Company Logo White Container */}
          <div className="mb-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-md ring-4 ring-indigo-50 flex items-center justify-center transition-all">
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
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 leading-relaxed">
            Sistem Manajemen Gudang Sewa Pancawati
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
          
          {/* Username / NIK Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Username atau NIK *
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputUsername}
                onChange={e => setInputUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-slate-500"
                placeholder="Masukkan username atau NIK (misal: admin, USR-1)"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Kata Sandi *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold cursor-pointer focus:outline-none"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-slate-500"
                placeholder="Masukkan kata sandi..."
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 mt-2"
          >
            {showSuccess ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Login Berhasil...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Footer copyright */}
      <div className="my-3 z-10">
        <div className="bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-slate-200 text-[11px] font-semibold text-center shadow-sm">
          &copy; {new Date().getFullYear()} {appTitle || 'WMS Gudang'} • Powered By Hasan Hariri
        </div>
      </div>

    </div>
  );
};
