import React, { useState, useEffect } from 'react';
import { getCurrentPositionCoordinates } from '../services/locationService';
import { MapPin, Navigation, Phone, CheckCircle2, X, Search, Loader2, Sparkles } from 'lucide-react';

export default function LocationModal({ isOpen, onClose, currentLocation, onSelectLocation }) {
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('gharsee_customer_phone') || '';
  });
  const [selectedCity, setSelectedCity] = useState(currentLocation?.name || 'Indiranagar, Bengaluru');
  const [houseNumber, setHouseNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const POPULAR_LOCALITIES = [
    { name: 'Indiranagar, Bengaluru', city: 'Bengaluru', lat: 12.9784, lon: 77.6408 },
    { name: 'Koramangala, Bengaluru', city: 'Bengaluru', lat: 12.9352, lon: 77.6245 },
    { name: 'Whitefield, Bengaluru', city: 'Bengaluru', lat: 12.9698, lon: 77.7500 },
    { name: 'HSR Layout, Bengaluru', city: 'Bengaluru', lat: 12.9121, lon: 77.6446 },
    { name: 'Chikkamagaluru, Karnataka', city: 'Chikkamagaluru', lat: 13.3161, lon: 75.7720 },
    { name: 'Mysuru, Karnataka', city: 'Mysuru', lat: 12.2958, lon: 76.6394 }
  ];

  // Auto-fetch saved address when phone number is entered
  useEffect(() => {
    if (customerPhone.trim().length >= 10) {
      try {
        const savedAddresses = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
        const phoneDigits = customerPhone.replace(/\D/g, '');
        if (savedAddresses[phoneDigits]) {
          const saved = savedAddresses[phoneDigits];
          setSelectedCity(saved.name);
          setHouseNumber(saved.houseNumber || '');
          setStreetAddress(saved.streetAddress || '');
          setStatusMsg(`Welcome back! Found saved address for ${phoneDigits}`);
        }
      } catch (e) {}
    }
  }, [customerPhone]);

  if (!isOpen) return null;

  const handleEnableDeviceLocation = async () => {
    setIsDetecting(true);
    setStatusMsg(null);

    const coords = await getCurrentPositionCoordinates();
    setIsDetecting(false);

    if (coords) {
      const locObj = {
        name: currentLocation?.name || 'Indiranagar, Bengaluru',
        latitude: coords.latitude,
        longitude: coords.longitude,
        houseNumber,
        streetAddress
      };
      onSelectLocation(locObj);
      savePhoneAddress(customerPhone, locObj);
      setStatusMsg('📍 Device Location Detected Successfully!');
      setTimeout(() => onClose(), 800);
    }
  };

  const handleManualSelection = (loc) => {
    const locObj = {
      name: loc.name,
      latitude: loc.lat,
      longitude: loc.lon,
      houseNumber,
      streetAddress
    };
    onSelectLocation(locObj);
    savePhoneAddress(customerPhone, locObj);
    onClose();
  };

  const savePhoneAddress = (phoneStr, locObj) => {
    if (!phoneStr) return;
    try {
      const digits = phoneStr.replace(/\D/g, '');
      if (digits.length >= 10) {
        const savedAddresses = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
        savedAddresses[digits] = locObj;
        localStorage.setItem('gharsee_phone_addresses', JSON.stringify(savedAddresses));
        localStorage.setItem('gharsee_customer_phone', digits);
      }
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
      
      {/* BLINKIT-STYLE CENTER POPUP MODAL */}
      <div className="bg-white w-full max-w-md rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER BRAND & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-md">
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight">
              Select Delivery Location
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm font-medium">
              Enter your phone number & location to view nearby stores
            </p>
          </div>
        </div>

        {/* STATUS BANNER */}
        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* PHONE NUMBER FIELD */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Mobile Phone Number (For Address Auto-Fetch)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
            />
            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* ACTION BUTTON 1: ENABLE DEVICE LOCATION */}
        <button
          onClick={handleEnableDeviceLocation}
          disabled={isDetecting}
          className="w-full py-4 px-5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {isDetecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 text-emerald-300 fill-emerald-400" />
          )}
          <span>ENABLE DEVICE LOCATION (GPS)</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">OR SELECT MANUALLY</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* ACTION BUTTON 2: POPULAR LOCALITIES */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Popular Delivery Localities
          </label>

          <div className="space-y-2">
            {POPULAR_LOCALITIES.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => handleManualSelection(loc)}
                className="w-full p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-emerald-100 text-stone-600 group-hover:text-emerald-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">{loc.name}</h4>
                    <p className="text-[11px] text-stone-500 font-medium">Delivering fresh groceries in 15-25 min</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">SELECT</span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
