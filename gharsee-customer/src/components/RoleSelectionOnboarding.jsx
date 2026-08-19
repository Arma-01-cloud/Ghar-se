import React, { useState, useRef } from 'react';
import { signUpUser, signInUser } from '../services/authService';
import { Leaf, User, Store, Bike, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function RoleSelectionOnboarding({ onComplete, onContinueAsGuest }) {
  const [selectedRole, setSelectedRole] = useState(null); // null | 'customer' | 'shopkeeper' | 'rider'
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'login'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const submitLockRef = useRef(false);

  // Customer Form State
  const [custForm, setCustForm] = useState({ name: '', phone: '', password: '' });

  // Shopkeeper Form State
  const [shopForm, setShopForm] = useState({ storeName: '', ownerName: '', phone: '', address: '', password: '' });

  // Rider Form State
  const [riderForm, setRiderForm] = useState({ name: '', phone: '', address: '', password: '' });

  // Login Form State
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    const res = await signUpUser({
      phone: custForm.phone,
      password: custForm.password,
      fullName: custForm.name,
      role: 'customer'
    });

    setIsSubmitting(false);
    submitLockRef.current = false;

    if (res.error || !res.user) {
      setFeedback({ type: 'error', message: res.error || 'Registration failed. Please try again.' });
      return;
    }

    setFeedback({ type: 'success', message: 'Welcome to UR GROZY! Your Customer account is ready.' });
    setTimeout(() => {
      onComplete({ role: 'customer', user: res.user });
    }, 800);
  };

  const handleShopkeeperSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    const res = await signUpUser({
      phone: shopForm.phone,
      password: shopForm.password,
      fullName: shopForm.ownerName,
      role: 'shopkeeper',
      storeName: shopForm.storeName,
      address: shopForm.address
    });

    setIsSubmitting(false);
    submitLockRef.current = false;

    if (res.error || !res.user) {
      setFeedback({ type: 'error', message: res.error || 'Shopkeeper registration failed.' });
      return;
    }

    setFeedback({
      type: 'success',
      message: 'Welcome to UR GROZY! Your Shopkeeper account is ready.'
    });

    setTimeout(() => {
      onComplete({ role: 'shopkeeper', user: res.user });
    }, 800);
  };

  const handleRiderSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    const res = await signUpUser({
      phone: riderForm.phone,
      password: riderForm.password,
      fullName: riderForm.name,
      role: 'rider'
    });

    setIsSubmitting(false);
    submitLockRef.current = false;

    if (res.error || !res.user) {
      setFeedback({ type: 'error', message: res.error || 'Rider registration failed.' });
      return;
    }

    setFeedback({
      type: 'success',
      message: 'Welcome to UR GROZY! Your Rider account is ready.'
    });

    setTimeout(() => {
      onComplete({ role: 'rider', user: res.user });
    }, 800);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    const res = await signInUser({
      phone: loginForm.phone,
      password: loginForm.password
    });

    setIsSubmitting(false);
    submitLockRef.current = false;

    if (res.error || !res.user) {
      setFeedback({ type: 'error', message: res.error || 'Incorrect phone number or password.' });
      return;
    }

    setFeedback({ type: 'success', message: 'Logged in successfully!' });
    setTimeout(() => {
      onComplete({ role: 'customer', user: res.user });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-200">
      
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-10 space-y-8 relative overflow-hidden">
        
        {/* BRAND LOGO */}
        <div className="text-center space-y-3">
          <div className="flex justify-center pb-1">
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-14 sm:h-16 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-950 tracking-tight">
              Welcome to UR GROZY
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm font-medium mt-1">
              Your Daily Groceries, Delivered Fresh from Local Stores
            </p>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-950 border-emerald-300' :
            'bg-rose-50 text-rose-950 border-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* ROLE SELECTION CARDS */}
        {!selectedRole && authMode === 'signup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display font-extrabold text-lg text-stone-900">
                How do you want to use UR GROZY?
              </h2>
              <p className="text-stone-500 text-xs mt-0.5">Select your role to get started</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* CUSTOMER */}
              <button
                onClick={() => setSelectedRole('customer')}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-emerald-700 hover:bg-emerald-50/40 flex flex-col items-center text-center transition-all group shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-base text-stone-900">👤 Customer</h3>
                <p className="text-stone-500 text-[11px] mt-1 font-medium">Shop groceries from local stores</p>
              </button>

              {/* SHOPKEEPER */}
              <button
                onClick={() => setSelectedRole('shopkeeper')}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-600 hover:bg-amber-50/40 flex flex-col items-center text-center transition-all group shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3 group-hover:bg-amber-800 group-hover:text-white transition-colors">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-base text-stone-900">🏪 Shopkeeper</h3>
                <p className="text-stone-500 text-[11px] mt-1 font-medium">Sell & manage your store online</p>
              </button>

              {/* RIDER */}
              <button
                onClick={() => setSelectedRole('rider')}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-blue-600 hover:bg-blue-50/40 flex flex-col items-center text-center transition-all group shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3 group-hover:bg-blue-800 group-hover:text-white transition-colors">
                  <Bike className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-base text-stone-900">🚴 Rider</h3>
                <p className="text-stone-500 text-[11px] mt-1 font-medium">Deliver groceries & earn payouts</p>
              </button>

            </div>

            <div className="pt-2 text-center">
              <button
                onClick={onContinueAsGuest}
                className="text-xs font-extrabold text-stone-500 hover:text-emerald-800 underline transition-colors"
              >
                Skip & Browse Local Stores as Guest ➔
              </button>
            </div>
          </div>
        )}

        {/* CUSTOMER REGISTRATION FORM */}
        {selectedRole === 'customer' && authMode === 'signup' && (
          <form onSubmit={handleCustomerSignup} className="space-y-3.5 text-xs font-semibold">
            <h3 className="font-display font-black text-lg text-stone-900 text-center">
              Customer Registration
            </h3>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Rahul Kumar"
                value={custForm.name}
                onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="8123821300"
                value={custForm.phone}
                onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={custForm.password}
                onChange={(e) => setCustForm({ ...custForm, password: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                disabled={isSubmitting}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>JOIN AS CUSTOMER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* SHOPKEEPER REGISTRATION FORM */}
        {selectedRole === 'shopkeeper' && authMode === 'signup' && (
          <form onSubmit={handleShopkeeperSubmit} className="space-y-3.5 text-xs font-semibold">
            <h3 className="font-display font-black text-lg text-stone-900 text-center">
              Shopkeeper Partner Signup
            </h3>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Store Name *</label>
              <input
                type="text"
                required
                placeholder="Sri Lakshmi Provision Store"
                value={shopForm.storeName}
                onChange={(e) => setShopForm({ ...shopForm, storeName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Owner Name *</label>
              <input
                type="text"
                required
                placeholder="Ramesh Kumar"
                value={shopForm.ownerName}
                onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="8123821300"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Store Address *</label>
              <input
                type="text"
                required
                placeholder="100 Feet Road, Indiranagar, Bengaluru"
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={shopForm.password}
                onChange={(e) => setShopForm({ ...shopForm, password: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                disabled={isSubmitting}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Store...</span>
                  </>
                ) : (
                  <>
                    <span>JOIN AS SHOPKEEPER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* RIDER REGISTRATION FORM */}
        {selectedRole === 'rider' && authMode === 'signup' && (
          <form onSubmit={handleRiderSubmit} className="space-y-3.5 text-xs font-semibold">
            <h3 className="font-display font-black text-lg text-stone-900 text-center">
              Delivery Partner Signup
            </h3>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Arman Kumar"
                value={riderForm.name}
                onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="8123821300"
                value={riderForm.phone}
                onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">City / Address *</label>
              <input
                type="text"
                required
                placeholder="Indiranagar, Bengaluru"
                value={riderForm.address}
                onChange={(e) => setRiderForm({ ...riderForm, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={riderForm.password}
                onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                disabled={isSubmitting}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Rider...</span>
                  </>
                ) : (
                  <>
                    <span>JOIN AS RIDER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
            <h3 className="font-display font-black text-lg text-stone-900 text-center">
              Log In to UR GROZY
            </h3>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="8123821300"
                value={loginForm.phone}
                onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FOOTER SWITCH */}
        <div className="pt-4 border-t border-stone-100 text-center text-xs">
          {authMode === 'signup' ? (
            <p className="text-stone-500 font-medium">
              Already registered on UR GROZY?{' '}
              <button
                onClick={() => { setAuthMode('login'); setSelectedRole(null); }}
                className="font-bold text-emerald-800 hover:underline"
              >
                Log In Here
              </button>
            </p>
          ) : (
            <p className="text-stone-500 font-medium">
              Don't have an account yet?{' '}
              <button
                onClick={() => { setAuthMode('signup'); setSelectedRole(null); }}
                className="font-bold text-emerald-800 hover:underline"
              >
                Choose Role & Sign Up
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}