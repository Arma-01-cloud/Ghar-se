import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { signUpUserWithPhone, signInUserWithPhone } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { Bike, Phone, Lock, User, ArrowLeft, ArrowRight, Loader2, AlertCircle, ShieldCheck, MapPin } from 'lucide-react';

export default function RiderLogin() {
  const { loginRider, addRiderToast } = useRider();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [signupStep, setSignupStep] = useState(1); // 1: Account, 2: Vehicle details

  // Step 1 State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 Vehicle Details State
  const [vehicleType, setVehicleType] = useState('scooter');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Bengaluru');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    setErrorMsg(null);
    setSignupStep(2);
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !drivingLicense.trim()) {
      setErrorMsg('Please enter your vehicle registration number and driving license number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. Sign up user profile
    const res = await signUpUserWithPhone({
      phone: phone.trim(),
      password,
      fullName: fullName.trim() || 'Delivery Partner',
      role: 'rider'
    });

    if (res.error) {
      setIsSubmitting(false);
      setErrorMsg(res.error);
      addRiderToast(res.error, 'error');
      return;
    }

    // 2. Insert or update rider_profiles record with vehicle details
    try {
      await supabase.from('rider_profiles').upsert({
        user_id: res.user.id,
        full_name: fullName.trim(),
        phone: res.user.phone,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driving_license: drivingLicense.trim().toUpperCase(),
        delivery_city: deliveryCity,
        is_online: true
      }, { onConflict: 'phone' });
    } catch (err) {
      console.error('Error saving rider vehicle details:', err);
    }

    setIsSubmitting(false);
    addRiderToast('Rider account & vehicle details registered successfully! 🚴', 'success');
    loginRider(res.user);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

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

      {/* LOGIN / SIGNUP CARD */}
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
              {mode === 'signup' 
                ? (signupStep === 1 ? 'STEP 1: RIDER ACCOUNT' : 'STEP 2: VEHICLE DETAILS')
                : 'RIDER PORTAL LOGIN'
              }
            </span>
          </div>

          <p className="text-stone-500 text-xs sm:text-sm pt-1">
            {mode === 'signup'
              ? (signupStep === 1 ? 'Enter your personal account credentials.' : 'Enter your delivery vehicle and license information.')
              : 'Sign in with your mobile number and password.'
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

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>LOGIN TO RIDER APP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP STEP 1 FORM */}
        {mode === 'signup' && signupStep === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4 text-xs font-semibold">
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

            <button
              type="submit"
              className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>NEXT: VEHICLE DETAILS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SIGNUP STEP 2: VEHICLE DETAILS FORM */}
        {mode === 'signup' && signupStep === 2 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4 text-xs font-semibold animate-in fade-in">
            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Vehicle Type *
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="scooter">🛵 Scooter (Activa, Jupiter, etc.)</option>
                <option value="motorcycle">🏍️ Motorcycle (Pulsar, Splendor, etc.)</option>
                <option value="ev">⚡ Electric Scooter / EV</option>
                <option value="bicycle">🚲 Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Vehicle Registration Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="KA-01-EA-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-stone-900 focus:outline-none focus:border-emerald-600 uppercase"
                />
                <Bike className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Driving License Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="KA0120230045678"
                  value={drivingLicense}
                  onChange={(e) => setDrivingLicense(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-stone-900 focus:outline-none focus:border-emerald-600 uppercase"
                />
                <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                Preferred Delivery City *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Bengaluru / Chikkamagaluru"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="py-3.5 px-4 bg-stone-100 text-stone-700 font-bold text-xs rounded-2xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>SUBMIT & START DELIVERING</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TOGGLE MODE */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-2">
          {mode === 'login' ? (
            <p className="text-xs font-semibold text-stone-600">
              New delivery partner?{' '}
              <button
                onClick={() => { setMode('signup'); setSignupStep(1); setErrorMsg(null); }}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Register as Rider
              </button>
            </p>
          ) : (
            <p className="text-xs font-semibold text-stone-600">
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setSignupStep(1); setErrorMsg(null); }}
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
