import React, { useState } from 'react';
import { 
  MapPin, Compass, Search, Home, Briefcase, 
  X, CheckCircle2, AlertCircle, Loader2, Navigation, Building2 
} from 'lucide-react';
import { getCurrentPositionCoordinates } from '../services/locationService';

export default function LocationModal({ isOpen, onClose, currentLocation, onSelectLocation }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Extensible Popular Cities & Locality Presets
  const PRESET_LOCALITIES = [
    { name: 'Chikkamagaluru, Karnataka', latitude: 13.3161, longitude: 75.7720, label: 'Chikkamagaluru' },
    { name: 'Indiranagar, Bengaluru', latitude: 12.9784, longitude: 77.6408, label: 'Indiranagar' },
    { name: 'Koramangala, Bengaluru', latitude: 12.9352, longitude: 77.6245, label: 'Koramangala' },
    { name: 'HAL 2nd Stage, Bengaluru', latitude: 12.9620, longitude: 77.6580, label: 'HAL 2nd Stage' },
    { name: 'HSR Layout, Bengaluru', latitude: 12.9121, longitude: 77.6446, label: 'HSR Layout' },
    { name: 'Whitefield, Bengaluru', latitude: 12.9698, longitude: 77.7500, label: 'Whitefield' },
    { name: 'MG Road, Bengaluru', latitude: 12.9756, longitude: 77.6066, label: 'MG Road' },
    { name: 'Mysuru, Karnataka', latitude: 12.2958, longitude: 76.6394, label: 'Mysuru' },
    { name: 'Mangaluru, Karnataka', latitude: 12.9141, longitude: 74.8560, label: 'Mangaluru' },
    { name: 'Hubballi, Karnataka', latitude: 15.3647, longitude: 75.1240, label: 'Hubballi' }
  ];

  const filteredLocalities = PRESET_LOCALITIES.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseGPS = async () => {
    setIsDetecting(true);
    setErrorMsg(null);

    try {
      const coords = await getCurrentPositionCoordinates();
      setIsDetecting(false);
      onSelectLocation({
        name: `My GPS Location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      onClose();
    } catch (err) {
      setIsDetecting(false);
      setErrorMsg(err.message || 'Unable to detect location. Please select your city or area manually.');
    }
  };

  const handleSelectLocality = (loc) => {
    onSelectLocation({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-6 border border-stone-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* HEADER */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
            <MapPin className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            <span>Select Delivery City / Locality</span>
          </div>
          <p className="text-stone-500 text-xs font-medium">
            Displays all active registered shops serving your selected city
          </p>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GPS BUTTON */}
        <button
          onClick={handleUseGPS}
          disabled={isDetecting}
          className="w-full p-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md flex items-center justify-between transition-all group disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              {isDetecting ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-200" />
              ) : (
                <Navigation className="w-5 h-5 text-emerald-300 fill-emerald-300/20 group-hover:scale-110 transition-transform" />
              )}
            </div>
            <div className="text-left">
              <span className="block font-black text-sm">Use my current location</span>
              <span className="text-[11px] text-emerald-200/80 font-medium">GPS Browser Detection</span>
            </div>
          </div>
          <Compass className="w-5 h-5 text-emerald-300" />
        </button>

        {/* SEARCH CITY INPUT */}
        <div className="space-y-2">
          <label className="block text-stone-700 font-bold text-xs">Search City or Locality</label>
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="e.g. Chikkamagaluru, Bengaluru, Mysuru"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* CITIES & LOCALITIES LIST */}
        <div className="space-y-2.5">
          <label className="block text-stone-700 font-bold text-xs">Select City / Locality</label>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredLocalities.map((loc, idx) => {
              const isSelected = currentLocation?.name === loc.name;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectLocality(loc)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs'
                      : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50 text-stone-800 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3 text-xs">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="block font-bold text-xs">{loc.label}</span>
                      <span className="text-[10px] text-stone-500">{loc.name}</span>
                    </div>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
