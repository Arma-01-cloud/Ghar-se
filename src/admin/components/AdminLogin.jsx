import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ShieldCheck, Lock, KeyRound, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(password, username);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* TOP BAR */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Return to Customer Website
        </a>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-stone-200 p-8 shadow-xl space-y-6 my-auto">
        
        {/* BRAND LOGO & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>
          
          <div>
            <span className="font-display font-black text-2xl text-stone-900 tracking-tight block">
              Ghar<span className="text-emerald-600">See</span> Admin HQ
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 uppercase tracking-wider mt-1">
              <Lock className="w-3.5 h-3.5" />
              CENTRAL COMMAND CONSOLE
            </span>
          </div>

          <p className="text-stone-500 text-xs sm:text-sm pt-1 font-medium">
            Authorized administrator access only. Enter master security key to govern store and rider registrations.
          </p>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-rose-950">Access Denied</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
              Administrator Handle
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 transition-all placeholder:text-stone-400"
              placeholder="e.g. Admin / Superuser"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
              Master Admin Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-4 pr-11 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 transition-all placeholder:text-stone-400"
                placeholder="Enter access password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>VERIFYING MASTER KEY...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>AUTHENTICATE & ENTER HQ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400 font-medium">
            🔒 Protected by 256-bit encrypted security • Admin session restricted
          </p>
        </div>

      </div>

      <div className="text-center text-xs text-stone-400 font-semibold py-4">
        © {new Date().getFullYear()} GharSee Central Platform Operations. All rights reserved.
      </div>
    </div>
  );
}
