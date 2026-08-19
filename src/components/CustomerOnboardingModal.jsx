import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Compass, CheckCircle2, AlertCircle, Loader2, Building2, Search, ArrowRight, ShoppingBag, User } from 'lucide-react';
import { getCurrentPositionWithAddress, fetchCustomerAddressByPhone, saveCustomerPhoneAddress } from '../services/locationService';
import { useCart } from '../context/CartContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from '../services/authService';

export default function CustomerOnboardingModal({ isOpen, onClose }) {
  const { setCustomerLocation, setCustomerPhone, setCustomerName, customerPhone: contextPhone, addToast } = useCart();

  const [fullName, setFullName] = useState(() => {
    try { return localStorage.getItem('gharsee_customer_name') || ''; } catch { return ''; }
  });
  const [phone, setPhone] = useState(contextPhone || '');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(null);

  const [selectedLocality, setSelectedLocality] = useState(null);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const PRESET_LOCALITIES = [
    { name: 'Uppalli, Chikkamagaluru', latitude: 13.3284, longitude: 75.7578, label: 'Uppalli', area: 'Uppalli', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Vijayapura, Chikkamagaluru', latitude: 13.3210, longitude: 75.7820, label: 'Vijayapura', area: 'Vijayapura', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Market Road, Chikkamagaluru', latitude: 13.3161, longitude: 75.7720, label: 'Market Road / IG Road', area: 'Market Road', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'MG Road, Chikkamagaluru', latitude: 13.3175, longitude: 75.7725, label: 'MG Road', area: 'MG Road', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Rathnagiri Road, Chikkamagaluru', latitude: 13.3245, longitude: 75.7780, label: 'Rathnagiri Road', area: 'Rathnagiri Road', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'KM Road, Chikkamagaluru', latitude: 13.3280, longitude: 75.7650, label: 'KM Road', area: 'KM Road', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Basavanahalli, Chikkamagaluru', latitude: 13.3180, longitude: 75.7760, label: 'Basavanahalli', area: 'Basavanahalli', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Shankarpura, Chikkamagaluru', latitude: 13.3140, longitude: 75.7680, label: 'Shankarpura', area: 'Shankarpura', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Kalyan Nagar, Chikkamagaluru', latitude: 13.3315, longitude: 75.7830, label: 'Kalyan Nagar', area: 'Kalyan Nagar', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Housing Board Colony, Chikkamagaluru', latitude: 13.3340, longitude: 75.7710, label: 'Housing Board Colony', area: 'Housing Board Colony', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Jyothi Nagar, Chikkamagaluru', latitude: 13.3320, longitude: 75.7610, label: 'Jyothi Nagar', area: 'Jyothi Nagar', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Dantaramakki, Chikkamagaluru', latitude: 13.3260, longitude: 75.7920, label: 'Dantaramakki', area: 'Dantaramakki', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Ramanahalli, Chikkamagaluru', latitude: 13.3080, longitude: 75.7850, label: 'Ramanahalli', area: 'Ramanahalli', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Bus Stand Road, Chikkamagaluru', latitude: 13.3195, longitude: 75.7745, label: 'Bus Stand Road', area: 'Bus Stand Road', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' },
    { name: 'Naidu Street, Chikkamagaluru', latitude: 13.3170, longitude: 75.7740, label: 'Naidu Street', area: 'Naidu Street', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101' }
  ];

  // Auto-search Supabase database whenever phone number reaches 10 digits
  useEffect(() => {
    async function checkSupabaseCustomerHistory() {
      const cleanDigits = get10DigitPhone(phone);
      if (cleanDigits.length === 10) {
        setIsSearchingPhone(true);
        const customerData = await fetchCustomerAddressByPhone(cleanDigits);
        setIsSearchingPhone(false);

        if (customerData) {
          setExistingCustomer(customerData);
          if (customerData.full_name) {
            setFullName(customerData.full_name);
          }
          if (customerData.address_text) {
            setSelectedLocality({
              name: customerData.address_text || `${customerData.street || ''}, ${customerData.city || 'Chikkamagaluru'}`.trim(),
              area: customerData.street || 'Uppalli',
              city: customerData.city || 'Chikkamagaluru',
              state: 'Karnataka',
              pincode: customerData.pincode || '577101',
              latitude: customerData.latitude ? parseFloat(customerData.latitude) : 13.3284,
              longitude: customerData.longitude ? parseFloat(customerData.longitude) : 75.7578
            });
          }
        } else {
          setExistingCustomer(null);
        }
      } else {
        setExistingCustomer(null);
      }
    }
    checkSupabaseCustomerHistory();
  }, [phone]);

  if (!isOpen) return null;

  const filteredLocalities = PRESET_LOCALITIES.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseGPS = async () => {
    setIsDetectingGPS(true);
    setErrorMsg('');

    try {
      const result = await getCurrentPositionWithAddress();
      setIsDetectingGPS(false);
      const gpsLoc = {
        name: result.name || `${result.area || 'Uppalli'}, Chikkamagaluru`,
        area: result.area || 'Uppalli',
        district: result.district || 'Chikkamagaluru',
        city: result.city || 'Chikkamagaluru',
        state: result.state || 'Karnataka',
        pincode: result.pincode || '577101',
        formattedAddress: result.formattedAddress || `${result.area || 'Uppalli'}, Chikkamagaluru, Karnataka - 577101`,
        latitude: result.latitude || 13.3284,
        longitude: result.longitude || 75.7578
      };
      setSelectedLocality(gpsLoc);
    } catch (err) {
      setIsDetectingGPS(false);
      if (err?.code === 'PERMISSION_DENIED') {
        setErrorMsg('Location permission is disabled in browser. Please select your area below or allow location access in browser settings.');
      } else {
        // Safe graceful fallback to Uppalli, Chikkamagaluru without crashing
        setSelectedLocality(PRESET_LOCALITIES[0]);
      }
    }
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanDigits = get10DigitPhone(phone);
    if (cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!selectedLocality) {
      setErrorMsg('Please select your location (GPS or manual selection).');
      return;
    }

    const normalizedPhone = `+91${cleanDigits}`;
    const nameVal = fullName.trim();

    if (setCustomerPhone) {
      setCustomerPhone(normalizedPhone);
    }
    if (setCustomerName) {
      setCustomerName(nameVal);
    }
    try {
      localStorage.setItem('gharsee_customer_name', nameVal);
    } catch {}

    setCustomerLocation(selectedLocality);

    // Save/Update NEW or EXISTING customer in Supabase database
    await saveCustomerPhoneAddress({
      phone: normalizedPhone,
      fullName: nameVal,
      addressText: selectedLocality.formattedAddress || selectedLocality.name,
      area: selectedLocality.area,
      district: selectedLocality.district || 'Chikkamagaluru',
      city: selectedLocality.city || 'Chikkamagaluru',
      state: selectedLocality.state || 'Karnataka',
      pincode: selectedLocality.pincode || '577101',
      latitude: selectedLocality.latitude,
      longitude: selectedLocality.longitude
    });

    addToast(`Welcome ${nameVal}! Phone: ${normalizedPhone}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-stone-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-12 sm:h-14 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
            Welcome to UR GROZY 🛒
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto">
            Please enter your name, phone number & location to view local grocery stores.
          </p>
        </div>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-4">
          
          {/* STEP 1: MOBILE PHONE NUMBER (FIRST FOR FAST LOOKUP) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700">
              1. Mobile Phone Number <span className="text-rose-500">*</span>
            </label>
            
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-xs font-black text-stone-400">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength="10"
                placeholder="Enter 10-digit mobile number"
                value={phone.replace(/^\+91/, '')}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-12 pr-10 py-3 text-sm font-black text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
              {isSearchingPhone && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {/* RETRIEVED CUSTOMER ADDRESS NOTICE FROM SUPABASE */}
            {existingCustomer && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-950 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-emerald-900">✓ Customer Record Found in Supabase!</span>
                  <span>Name: <b>{existingCustomer.full_name}</b> {existingCustomer.address_text ? `• Location: ${existingCustomer.address_text}` : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: FULL NAME */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700">
              2. Your Full Name <span className="text-rose-500">*</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* STEP 3: LOCATION SELECTION */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700">
              3. Delivery Location <span className="text-rose-500">*</span>
            </label>

            {/* DEVICE GPS LOCATION BUTTON */}
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={isDetectingGPS}
              className="w-full p-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-sm flex items-center justify-between transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  {isDetectingGPS ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  ) : (
                    <Compass className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block font-black text-xs">Enable Device GPS Location</span>
                  <span className="text-[10px] text-emerald-200/80 font-medium">Automatic Browser Detection</span>
                </div>
              </div>
              <MapPin className="w-4 h-4 text-emerald-300" />
            </button>

            {/* SEARCH MANUAL CITIES */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Or search city / area manually..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* MANUAL LOCALITY SELECTION LIST */}
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {filteredLocalities.map((loc, idx) => {
                const isSelected = selectedLocality?.name === loc.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedLocality(loc);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-2xs'
                        : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50 text-stone-800 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{loc.name}</span>
                    </div>

                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 pt-3"
          >
            <span>START SHOPPING NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

      </div>
    </div>
  );
}
