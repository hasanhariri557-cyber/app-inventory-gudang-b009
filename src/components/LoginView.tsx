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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-y-auto">
      
      {/* Background Decorative Element */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-80" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative z-10 flex flex-col my-auto animate-fade-in">
        
        {/* Top Header Section */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col items-center text-center">
          {appLogoUrl ? (
            <img 
              src={appLogoUrl} 
              alt="Logo WMS" 
              className="w-16 h-16 object-contain rounded-2xl border border-slate-200 bg-white p-1 shadow-sm mb-3" 
            />
          ) : (
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-sm text-white mb-3">
              <Boxes className="w-8 h-8" />
            </div>
          )}
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
      <div className="text-slate-400 text-[10px] text-center mt-6 z-10">
        &copy; {new Date().getFullYear()} {appTitle || 'WMS Gudang'} • Powered By Hasan Hariri
      </div>

    </div>
  );
};
