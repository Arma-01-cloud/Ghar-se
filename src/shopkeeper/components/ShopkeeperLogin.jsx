import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { signInUserWithPhone, signUpUserWithPhone } from '../../services/authService';
import { Leaf, Lock, Phone, User, ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function ShopkeeperLogin() {
  const { loginShopkeeper, addShopkeeperToast } = useShopkeeper();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      setErrorMsg('Please enter your mobile phone number and password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    if (mode === 'signup') {
      const res = await signUpUserWithPhone({
        phone: phone.trim(),
        password,
        fullName: fullName.trim() || 'Store Partner',
        role: 'shopkeeper'
      });

      setIsSubmitting(false);

      if (res.error || !res.user) {
        setErrorMsg(res.error || 'Store partner registration failed.');
        addShopkeeperToast(res.error || 'Registration failed.', 'error');
      } else {
        addShopkeeperToast('Store partner account created! Logging in...', 'success');
        loginShopkeeper(res.user);
      }
    } else {
      const res = await signInUserWithPhone({
        phone: phone.trim(),
        password
      });

      setIsSubmitting(false);

      if (res.error || !res.user) {
        setErrorMsg(res.error || 'Invalid mobile phone number or incorrect password.');
        addShopkeeperToast(res.error || 'Login failed. Please check credentials.', 'error');
      } else {
        addShopkeeperToast('Welcome back to Store Partner Portal! 🎉', 'success');
        loginShopkeeper(res.user);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5] p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* TOP BAR BACK LINK */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Customer Website
        </a>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-stone-200 p-8 shadow-xl space-y-6 my-auto">
        
        {/* BRAND LOGO & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
            <Leaf className="w-8 h-8 stroke-[2.5]" />
          </div>
          
          <div>
            <span className="font-display font-black text-2xl text-stone-900 tracking-tight block">
              Ghar<span className="text-emerald-600">See</span> Store Partner
            </span>
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
              {mode === 'signup' ? 'NEW PARTNER REGISTRATION' : 'PARTNER PORTAL LOGIN'}
            </span>
          </div>

          <p className="text-stone-500 text-xs sm:text-sm pt-1">
            {mode === 'signup' 
              ? 'Register your store on GharSee using your mobile number and password.'
              : 'Sign in with your mobile number and password to manage your store.'
            }
          </p>
        </div>

        {/* SEGMENTED TAB SWITCH: LOGIN vs SIGNUP */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In / Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            New Partner Register
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-rose-950">Authentication Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Shop Owner Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
              Mobile Phone Number *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="8123821300"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'REGISTER STORE PARTNER' : 'LOGIN TO PARTNER PORTAL'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* TOGGLE MODE */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-2">
          {mode === 'login' ? (
            <p className="text-xs font-semibold text-stone-600">
              New store owner?{' '}
              <button
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Register Your Store
              </button>
            </p>
          ) : (
            <p className="text-xs font-semibold text-stone-600">
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Sign In to Portal
              </button>
            </p>
          )}
        </div>

      </div>

      <div className="text-center text-xs text-stone-400 font-semibold py-4">
        © {new Date().getFullYear()} GharSee Store Partner Portal. All rights reserved.
      </div>

    </div>
  );
}
