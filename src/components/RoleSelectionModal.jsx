import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { signUpUser, signInUser } from '../services/authService';
import { Leaf, User, Store, Bike, CheckCircle2, AlertCircle, X, ArrowRight, Loader2 } from 'lucide-react';

export default function RoleSelectionModal({ isOpen, onClose }) {
  const { setActiveTab } = useCart();

  const [selectedRole, setSelectedRole] = useState(null);
  const [authMode, setAuthMode] = useState('signup');
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

  if (!isOpen) return null;

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
      setFeedback({ type: 'error', message: res.error || 'Registration failed.' });
      return;
    }

    setFeedback({ type: 'success', message: 'Welcome to GharSee! Your Customer account is ready.' });
    setTimeout(() => {
      onClose();
      setActiveTab('home');
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
      message: 'Welcome to GharSee! Your Shopkeeper account is ready.'
    });

    setTimeout(() => {
      onClose();
      window.location.href = '/shopkeeper';
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
      message: 'Welcome to GharSee! Your Rider account is ready.'
    });

    setTimeout(() => {
      onClose();
      window.location.href = '/rider';
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
      onClose();
      if (res.user?.user_metadata?.role === 'shopkeeper' || res.profile?.role === 'shopkeeper') {
        window.location.href = '/shopkeeper';
      } else if (res.user?.user_metadata?.role === 'rider' || res.profile?.role === 'rider') {
        window.location.href = '/rider';
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-stone-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-md">
            <Leaf className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900">
            Welcome to GharSee
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            {selectedRole ? `Sign up as a ${selectedRole.toUpperCase()}` : 'How would you like to use GharSee?'}
          </p>
        </div>

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

        {!selectedRole && authMode === 'signup' && (
          <div className="space-y-3">
            <button
              onClick={() => setSelectedRole('customer')}
              className="w-full p-4 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center gap-4 text-left transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-stone-900">👤 Customer</h4>
                <p className="text-stone-500 text-xs mt-0.5">Order groceries from local neighborhood stores with delivery after 4:00 PM.</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('shopkeeper')}
              className="w-full p-4 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center gap-4 text-left transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0 group-hover:bg-amber-800 group-hover:text-white transition-colors">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-stone-900">🏪 Shopkeeper Partner</h4>
                <p className="text-stone-500 text-xs mt-0.5">Register your local store, accept orders & manage inventory.</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('rider')}
              className="w-full p-4 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center gap-4 text-left transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0 group-hover:bg-blue-800 group-hover:text-white transition-colors">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-stone-900">🚴 Delivery Partner</h4>
                <p className="text-stone-500 text-xs mt-0.5">Deliver grocery orders & earn payout on every delivery task.</p>
              </div>
            </button>
          </div>
        )}

        {/* CUSTOMER FORM */}
        {selectedRole === 'customer' && authMode === 'signup' && (
          <form onSubmit={handleCustomerSignup} className="space-y-4 text-xs font-semibold">
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
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* SHOPKEEPER FORM */}
        {selectedRole === 'shopkeeper' && authMode === 'signup' && (
          <form onSubmit={handleShopkeeperSubmit} className="space-y-3.5 text-xs font-semibold">
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
                placeholder="Market Road, Chikkamagaluru"
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

        {/* RIDER FORM */}
        {selectedRole === 'rider' && authMode === 'signup' && (
          <form onSubmit={handleRiderSubmit} className="space-y-3.5 text-xs font-semibold">
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
                placeholder="Chikkamagaluru"
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

        <div className="pt-3 border-t border-stone-100 text-center text-xs">
          {authMode === 'signup' ? (
            <p className="text-stone-500 font-medium">
              Already registered?{' '}
              <button
                onClick={() => { setAuthMode('login'); setSelectedRole(null); }}
                className="font-bold text-emerald-800 hover:underline"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-stone-500 font-medium">
              Don't have an account?{' '}
              <button
                onClick={() => { setAuthMode('signup'); setSelectedRole(null); }}
                className="font-bold text-emerald-800 hover:underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
