import React, { useState, useEffect, useRef } from 'react';
import { 
  getCurrentPositionWithAddress, 
  searchLocationPlaces, 
  saveCustomerPhoneAddress 
} from '../services/locationService';
import { 
  MapPin, Navigation, Phone, CheckCircle2, X, Search, 
  Loader2, Home, Briefcase, Tag, 
  Compass, ArrowRight, AlertCircle
} from 'lucide-react';

const POPULAR_LOCALITIES = [
  { name: 'Indiranagar, Bengaluru', area: 'Indiranagar', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', latitude: 12.9784, longitude: 77.6408 },
  { name: 'Koramangala, Bengaluru', area: 'Koramangala', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', latitude: 12.9352, longitude: 77.6245 },
  { name: 'Whitefield, Bengaluru', area: 'Whitefield', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', latitude: 12.9698, longitude: 77.7500 },
  { name: 'HSR Layout, Bengaluru', area: 'HSR Layout', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560102', latitude: 12.9121, longitude: 77.6446 },
  { name: 'Market Road, Chikkamagaluru', area: 'Market Road / IG Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', latitude: 13.3161, longitude: 75.7720 },
  { name: 'Jayachamarajendra Nagar, Mysuru', area: 'JC Nagar', district: 'Mysuru', city: 'Mysuru', state: 'Karnataka', pincode: '570010', latitude: 12.2958, longitude: 76.6394 },
  { name: 'Hampankatta, Mangaluru', area: 'Hampankatta', district: 'Dakshina Kannada', city: 'Mangaluru', state: 'Karnataka', pincode: '575001', latitude: 12.9141, longitude: 74.8560 }
];

export default function LocationModal({ isOpen, onClose, currentLocation, onSelectLocation }) {
  const [customerPhone, setCustomerPhone] = useState(() => {
    try { return localStorage.getItem('gharsee_customer_phone') || ''; } catch { return ''; }
  });

  // Active Location Coordinates & Structured Info
  const [activeLocation, setActiveLocation] = useState(() => {
    return {
      name: currentLocation?.name || 'Indiranagar, Bengaluru',
      area: currentLocation?.area || (currentLocation?.name?.split(',')[0]?.trim()) || 'Indiranagar',
      district: currentLocation?.district || 'Bengaluru Urban',
      city: currentLocation?.city || 'Bengaluru',
      state: currentLocation?.state || 'Karnataka',
      pincode: currentLocation?.pincode || '560038',
      formattedAddress: currentLocation?.formattedAddress || currentLocation?.name || 'Indiranagar, Bengaluru, Karnataka - 560038',
      latitude: currentLocation?.latitude || 12.9784,
      longitude: currentLocation?.longitude || 77.6408
    };
  });

  const [houseNumber, setHouseNumber] = useState(currentLocation?.flat || '');
  const [landmark, setLandmark] = useState(currentLocation?.street || '');
  const [addressTag, setAddressTag] = useState('Home'); // Home, Work, Other, Friends

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [savedAddressesList, setSavedAddressesList] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Sync initial location when modal opens
  useEffect(() => {
    if (isOpen && currentLocation) {
      setActiveLocation({
        name: currentLocation.name || 'Chikkamagaluru, Karnataka',
        area: currentLocation.area || (currentLocation.name?.split(',')[0]?.trim()) || 'Local Area',
        district: currentLocation.district || 'Chikkamagaluru',
        city: currentLocation.city || 'Chikkamagaluru',
        state: currentLocation.state || 'Karnataka',
        pincode: currentLocation.pincode || '577101',
        formattedAddress: currentLocation.formattedAddress || currentLocation.name || 'Chikkamagaluru, Karnataka - 577101',
        latitude: currentLocation.latitude || 13.3161,
        longitude: currentLocation.longitude || 75.7720
      });
      if (currentLocation.flat) setHouseNumber(currentLocation.flat);
      if (currentLocation.street) setLandmark(currentLocation.street);
    }
  }, [isOpen, currentLocation]);

  // Load saved addresses from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
      const list = Object.entries(saved).map(([phone, data]) => ({
        phone,
        ...data
      }));
      setSavedAddressesList(list);
    } catch {}
  }, [isOpen]);

  // Live place search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocationPlaces(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  // Handler: GPS Detection with Automatic Reverse Geocoding
  const handleUseCurrentLocation = async () => {
    setIsDetectingGPS(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const result = await getCurrentPositionWithAddress();
      setIsDetectingGPS(false);

      setActiveLocation({
        name: result.name,
        area: result.area,
        district: result.district,
        city: result.city,
        state: result.state,
        pincode: result.pincode,
        formattedAddress: result.formattedAddress,
        latitude: result.latitude,
        longitude: result.longitude
      });

      setStatusMsg(`📍 GPS Location Verified: ${result.area}, ${result.district} (${result.pincode})`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setIsDetectingGPS(false);
      setErrorMsg(err.message || 'Unable to detect GPS location. Please select or search manually.');
    }
  };

  // Handler: Selecting a searched place / suggestion
  const handleSelectSearchResult = (place) => {
    setActiveLocation({
      name: place.name,
      area: place.area,
      district: place.district,
      city: place.city,
      state: place.state,
      pincode: place.pincode || '560001',
      formattedAddress: place.formattedAddress || `${place.area}, ${place.city}, ${place.state}`,
      latitude: place.latitude,
      longitude: place.longitude
    });
    setSearchQuery('');
    setSearchResults([]);
    setStatusMsg(`📍 Selected: ${place.name}`);
  };

  // Handler: Selecting a popular preset locality
  const handleSelectPreset = (loc) => {
    setActiveLocation({
      name: loc.name,
      area: loc.area,
      district: loc.district,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      formattedAddress: `${loc.area}, ${loc.city}, ${loc.state} - ${loc.pincode}`,
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    setStatusMsg(`📍 Selected: ${loc.name}`);
  };

  // Handler: Confirm & Apply Delivery Location
  const handleConfirmLocation = () => {
    const finalLocation = {
      name: activeLocation.name,
      area: activeLocation.area,
      district: activeLocation.district,
      city: activeLocation.city,
      state: activeLocation.state,
      pincode: activeLocation.pincode,
      formattedAddress: activeLocation.formattedAddress,
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      flat: houseNumber.trim(),
      street: landmark.trim(),
      tag: addressTag
    };

    if (onSelectLocation) {
      onSelectLocation(finalLocation);
    }

    // Save phone address association
    if (customerPhone) {
      try {
        const digits = customerPhone.replace(/\D/g, '');
        if (digits.length >= 10) {
          const savedAddresses = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
          savedAddresses[digits] = finalLocation;
          localStorage.setItem('gharsee_phone_addresses', JSON.stringify(savedAddresses));
          localStorage.setItem('gharsee_customer_phone', digits);
          saveCustomerPhoneAddress({
            phone: digits,
            fullName: customerName,
            flat: houseNumber,
            street: landmark || activeLocation.area,
            area: activeLocation.area,
            district: activeLocation.district,
            city: activeLocation.city,
            state: activeLocation.state,
            pincode: activeLocation.pincode,
            latitude: activeLocation.latitude,
            longitude: activeLocation.longitude,
            addressText: `${houseNumber ? houseNumber + ', ' : ''}${landmark ? landmark + ', ' : ''}${activeLocation.formattedAddress}`
          });
        }
      } catch {}
    }

    onClose();
  };

  // Google Maps Embed URL for interactive map view
  const mapEmbedUrl = `https://maps.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}&hl=en&z=16&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/65 backdrop-blur-md animate-in fade-in">
      
      {/* BLINKIT-STYLE MODAL CONTAINER */}
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/20">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-stone-900 leading-tight">
                Select Delivery Location
              </h2>
              <p className="text-stone-500 text-xs font-medium">
                Pinpoint your address for instant grocery delivery in 10-20 min
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SPLIT VIEW) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT COLUMN: SEARCH, GPS & ADDRESS FORM */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-stone-200">
            
            <div className="space-y-4">
              
              {/* STATUS OR ERROR NOTIFICATION */}
              {statusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{statusMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SEARCH BAR WITH LIVE AUTOCOMPLETE */}
              <div className="relative">
                <label className="block text-[11px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
                  Search Delivery Area or Landmark
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Indiranagar, Koramangala, Market Road..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5 top-3.5" />
                  ) : searchQuery ? (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                {/* SEARCH RESULTS DROPDOWN */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-stone-200 shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-stone-100">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full p-3 text-left hover:bg-emerald-50/60 transition-colors flex items-start gap-3"
                      >
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-stone-500 truncate">{item.formattedAddress}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PRIMARY BLINKIT "USE CURRENT LOCATION" (GPS) BUTTON */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingGPS}
                className="w-full p-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl bg-emerald-700 text-emerald-200 flex items-center justify-center">
                    {isDetectingGPS ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Navigation className="w-5 h-5 fill-emerald-300 stroke-emerald-950 group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-xs sm:text-sm block text-white">
                      {isDetectingGPS ? 'Detecting GPS & Reverse Geocoding...' : 'Use Current Location'}
                    </span>
                    <span className="text-[11px] text-emerald-200 font-medium">
                      Fetch Area, District, State & Pincode via GPS
                    </span>
                  </div>
                </div>

                <div className="text-emerald-200 group-hover:translate-x-1 transition-transform pr-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* POPULAR LOCALITIES QUICK CHIPS */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-extrabold text-stone-500 uppercase tracking-wider">
                  Popular Areas in Karnataka
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCALITIES.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        activeLocation.area === loc.area
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span>📍</span>
                      <span>{loc.area}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SAVED ADDRESSES SECTION (IF ANY) */}
              {savedAddressesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="block text-[11px] font-extrabold text-stone-500 uppercase tracking-wider">
                    Recent & Saved Addresses
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {savedAddressesList.slice(0, 3).map((saved, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setActiveLocation(saved);
                          if (saved.flat) setHouseNumber(saved.flat);
                          if (saved.street) setLandmark(saved.street);
                        }}
                        className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900 truncate">{saved.name || 'Saved Address'}</p>
                          <p className="text-[11px] text-stone-500 truncate">{saved.formattedAddress || `${saved.flat || ''} ${saved.street || ''}`}</p>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md ml-2">USE</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* MOBILE NUMBER FIELD (FOR AUTO-SYNC) */}
            <div className="pt-3 border-t border-stone-100 space-y-1.5">
              <label className="block text-[11px] font-extrabold text-stone-600 uppercase tracking-wider">
                Mobile Number (For Delivery Updates)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE MAP & DETAILED ADDRESS SHEET */}
          <div className="lg:col-span-6 p-5 sm:p-6 bg-[#FAF8F5] space-y-5 flex flex-col justify-between">
            
            <div className="space-y-4">
              
              {/* INTERACTIVE MAP CONTAINER */}
              <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-200">
                <iframe
                  title="Delivery Location Map"
                  src={mapEmbedUrl}
                  className="w-full h-full border-0 pointer-events-auto"
                  loading="lazy"
                />

                {/* RECENTER GPS FLOATING CONTROL */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingGPS}
                  title="Recenter to my location"
                  className="absolute top-3 right-3 p-2.5 bg-white hover:bg-stone-50 text-emerald-800 rounded-2xl shadow-md border border-stone-200 transition-transform active:scale-95 flex items-center gap-1.5 text-xs font-extrabold"
                >
                  <Compass className={`w-4 h-4 text-emerald-700 ${isDetectingGPS ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">My GPS</span>
                </button>

                {/* PINPOINT BANNER */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs rounded-2xl p-2.5 border border-stone-200 shadow-md flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold text-stone-900 truncate">
                      📍 {activeLocation.area}, {activeLocation.city}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium truncate">
                      {activeLocation.pincode ? `Pincode: ${activeLocation.pincode} • ${activeLocation.state}` : activeLocation.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAILED ADDRESS SPECIFICATION SHEET */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
                
                {/* LOCATION SUMMARY BADGE (NO LAT/LON STRINGS!) */}
                <div className="border-b border-stone-100 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      DELIVERY ADDRESS DETAILS
                    </span>
                    <span className="text-xs font-bold text-stone-400">⚡ 10-20 min</span>
                  </div>
                  <h3 className="font-display font-extrabold text-stone-900 text-base">
                    {activeLocation.area}, {activeLocation.city}
                  </h3>
                  <p className="text-xs text-stone-600 font-medium leading-tight">
                    {activeLocation.formattedAddress}
                  </p>
                </div>

                {/* FLAT / HOUSE NUMBER & LANDMARK INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      House / Flat / Floor No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, 3rd Floor"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Apartment / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near BDA Complex"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* ADDRESS CATEGORY TAGS */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-600">Save address as:</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Home', label: 'Home', icon: Home },
                      { id: 'Work', label: 'Work', icon: Briefcase },
                      { id: 'Other', label: 'Other', icon: Tag }
                    ].map(tag => {
                      const Icon = tag.icon;
                      const isSelected = addressTag === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setAddressTag(tag.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* CONFIRM AND SET LOCATION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
              >
                <span>CONFIRM & SET DELIVERY LOCATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
