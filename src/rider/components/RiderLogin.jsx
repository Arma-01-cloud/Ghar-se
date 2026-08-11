import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { signInUserWithPhone, signUpUserWithPhone } from '../../services/authService';
import { Bike, Phone, Lock, User, ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function RiderLogin() {
  const { loginRider, addRiderToast } = useRider();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;

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
        fullName: fullName.trim() || 'Delivery Partner',
        role: 'rider'
      });

      setIsSubmitting(false);

      if (res.error) {
        setErrorMsg(res.error);
        addRiderToast(res.error, 'error');
      } else {
        addRiderToast('Delivery partner account created! Logging in...', 'success');
        loginRider(res.user);
      }
    } else {
      const res = await signInUserWithPhone({
        phone: phone.trim(),
        password
      });

      setIsSubmitting(false);

      if (res.error) {
        setErrorMsg(res.error);
        addRiderToast(res.error, 'error');
      } else {
        addRiderToast('Welcome back to Delivery Partner App! 🚴', 'success');
        loginRider(res.user);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5] p-4 sm:p-6 lg:p-8">
      
      {/* TOP BACK LINK */}
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
            <Bike className="w-8 h-8 stroke-[2.5]" />
          </div>
          
          <div>
            <span className="font-display font-black text-2xl text-stone-900 tracking-tight block">
              Ghar<span className="text-emerald-600">See</span> Delivery
            </span>
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
              {mode === 'signup' ? 'NEW RIDER REGISTRATION' : 'RIDER PORTAL LOGIN'}
            </span>
          </div>

          <p className="text-stone-500 text-xs sm:text-sm pt-1">
            {mode === 'signup'
              ? 'Register as a delivery partner using your mobile number and password.'
              : 'Sign in with your mobile number and password to view delivery tasks.'
            }
          </p>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Arman Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                placeholder="+91 98765 00112"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>{mode === 'signup' ? 'REGISTER RIDER PARTNER' : 'LOGIN TO RIDER APP'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* TOGGLE MODE */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-2">
          {mode === 'login' ? (
            <p className="text-xs font-semibold text-stone-600">
              New delivery partner?{' '}
              <button
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Register as Rider
              </button>
            </p>
          ) : (
            <p className="text-xs font-semibold text-stone-600">
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Sign In to Rider App
              </button>
            </p>
          )}
        </div>

      </div>

      <div className="text-center text-xs text-stone-400 font-semibold py-4">
        © {new Date().getFullYear()} GharSee Delivery Partner App. All rights reserved.
      </div>

    </div>
  );
}
