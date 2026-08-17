import React, { useState, useRef, useEffect } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { getCurrentPositionWithAddress, searchLocationPlaces } from '../../services/locationService';
import { createStoreInSupabase, updateStoreInSupabase } from '../../services/storeService';
import { 
  Store, MapPin, Save, Plus, Loader2, 
  CheckCircle2, AlertCircle, UploadCloud, Image, Camera, 
  RefreshCw, Check, Eye, Search, Navigation, Compass
} from 'lucide-react';

const PRESET_STORE_IMAGES = [
  {
    id: 'lakshmi',
    name: 'Kirana & Provisions',
    category: 'Kirana / Grocery',
    url: '/images/store_lakshmi.jpg',
    description: 'Traditional neighborhood grocery & staples store'
  },
  {
    id: 'freshmart',
    name: 'Supermarket & Mart',
    category: 'Supermarket',
    url: '/images/store_freshmart.jpg',
    description: 'Modern supermarket aisle with packed items'
  },
  {
    id: 'vegfruits',
    name: 'Fresh Farm Produce',
    category: 'Fruits & Veggies',
    url: '/images/cat_veg_fruits.jpg',
    description: 'Farm-fresh organic fruits and green vegetables'
  },
  {
    id: 'grains',
    name: 'Grains & Pulses Depot',
    category: 'Rice & Grains',
    url: '/images/cat_rice_grains.jpg',
    description: 'Premium rice, pulses, flours, and daily essentials'
  },
  {
    id: 'dairy',
    name: 'Dairy & Bakery Corner',
    category: 'Dairy & Milk',
    url: '/images/cat_dairy.jpg',
    description: 'Fresh dairy products, milk, paneer, and bakery'
  }
];

// Helper to compress and convert image files to optimized WebP/JPEG Data URLs
function compressAndReadImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          width,
          height,
          name: file.name,
          sizeKb: Math.round((dataUrl.length * 3) / 4 / 1024)
        });
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export default function ShopkeeperStorePage() {
  const { 
    storeProfile, 
    authUser, 
    setStoreProfile, 
    setHasStore, 
    updateStoreProfile, 
    toggleStoreStatus, 
    addShopkeeperToast, 
    setActiveShopkeeperTab 
  } = useShopkeeper();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  // Detailed Address & Store Form State
  const [form, setForm] = useState({
    name: storeProfile?.name || '',
    ownerName: storeProfile?.ownerName || authUser?.user_metadata?.full_name || '',
    phone: storeProfile?.phone || authUser?.phone || authUser?.user_metadata?.phone || '',
    email: storeProfile?.email || authUser?.email || 'store@gharsee.app',
    shopNumber: '',
    street: '',
    locality: storeProfile?.locality || 'Indiranagar',
    city: storeProfile?.city || 'Bengaluru',
    state: storeProfile?.state || 'Karnataka',
    pincode: storeProfile?.pincode || '560038',
    category: 'Groceries & Fruits',
    description: 'Fresh local grocery darkstore supplying neighborhood orders.',
    openingTime: storeProfile?.openingTime || '07:00 AM',
    closingTime: storeProfile?.closingTime || '10:00 PM',
    image: storeProfile?.image || storeProfile?.image_url || '/images/store_lakshmi.jpg',
    latitude: storeProfile?.latitude || 12.9784,
    longitude: storeProfile?.longitude || 77.6408
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Live Location & Area Search
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

  useEffect(() => {
    if (storeProfile) {
      setForm(prev => ({
        ...prev,
        name: storeProfile.name || prev.name,
        ownerName: storeProfile.ownerName || storeProfile.owner_name || prev.ownerName,
        phone: storeProfile.phone || prev.phone,
        email: storeProfile.email || prev.email,
        locality: storeProfile.locality || prev.locality,
        city: storeProfile.city || prev.city,
        state: storeProfile.state || prev.state,
        pincode: storeProfile.pincode || prev.pincode,
        image: storeProfile.image || storeProfile.image_url || prev.image,
        latitude: storeProfile.latitude || prev.latitude,
        longitude: storeProfile.longitude || prev.longitude
      }));
    }
  }, [storeProfile]);

  const isExistingStore = Boolean(storeProfile && storeProfile.id);

  // Process and optimize uploaded image file
  const processImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addShopkeeperToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    setIsCompressing(true);
    try {
      const result = await compressAndReadImage(file);
      setForm(prev => ({ ...prev, image: result.dataUrl }));
      setImageInfo({
        name: result.name,
        sizeKb: result.sizeKb,
        dimensions: `${result.width}x${result.height}`
      });
      addShopkeeperToast(`Shop photo uploaded & optimized (${result.sizeKb} KB)! 📸`, 'success');
    } catch (err) {
      console.error('Image compression failed:', err);
      addShopkeeperToast('Failed to process image file. Please try another photo.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSelectPreset = (presetUrl) => {
    setForm(prev => ({ ...prev, image: presetUrl }));
    setImageInfo(null);
    addShopkeeperToast('Curated store image selected! ✨', 'info');
  };

  const handleResetImage = () => {
    setForm(prev => ({ ...prev, image: '/images/store_lakshmi.jpg' }));
    setImageInfo(null);
    addShopkeeperToast('Reset to default store photo', 'info');
  };

  // Handle GPS location detection with instant reverse geocoding
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatusMsg(null);

    try {
      const result = await getCurrentPositionWithAddress();
      setIsDetectingLocation(false);

      setForm(prev => ({
        ...prev,
        locality: result.area || result.city || prev.locality,
        city: result.city || prev.city,
        state: result.state || prev.state,
        pincode: result.pincode || prev.pincode,
        latitude: result.latitude,
        longitude: result.longitude
      }));
      setLocationStatusMsg(`📍 GPS Location Verified: ${result.area}, ${result.city} (${result.pincode})`);
      addShopkeeperToast(`GPS location detected: ${result.area}, ${result.city}! 📍`, 'success');
    } catch (err) {
      setIsDetectingLocation(false);
      addShopkeeperToast(err.message || 'Could not retrieve GPS location. Please search or enter manually.', 'error');
    }
  };

  const handleSelectSearchResult = (place) => {
    setForm(prev => ({
      ...prev,
      locality: place.area || place.city || prev.locality,
      city: place.city || prev.city,
      state: place.state || prev.state,
      pincode: place.pincode || prev.pincode,
      latitude: place.latitude,
      longitude: place.longitude
    }));
    setSearchQuery('');
    setSearchResults([]);
    setLocationStatusMsg(`📍 Selected: ${place.name}`);
    addShopkeeperToast(`Location set to ${place.name}!`, 'info');
  };

  // Handle Create Store Submission
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerName.trim() || !form.phone.trim()) {
      addShopkeeperToast('Please fill out all required store details.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const fullAddress = `${form.shopNumber ? form.shopNumber + ', ' : ''}${form.street ? form.street + ', ' : ''}${form.locality}, ${form.city}, ${form.state} - ${form.pincode}`;

    const storePayload = {
      name: form.name.trim(),
      ownerName: form.ownerName.trim(),
      phone: form.phone.trim(),
      address: fullAddress,
      city: form.city,
      locality: form.locality,
      state: form.state,
      pincode: form.pincode,
      latitude: form.latitude,
      longitude: form.longitude,
      image: form.image,
      image_url: form.image,
      categories: [form.category, 'Vegetables', 'Dairy']
    };

    const res = await createStoreInSupabase(storePayload, authUser);
    setIsSubmitting(false);

    if (res.error || !res.data) {
      const err = res.error || 'Failed to insert store into Supabase.';
      setErrorMsg(err);
      addShopkeeperToast(`Store Creation Failed: ${err}`, 'error');
      return;
    }

    const newStoreObj = {
      id: res.data.id,
      name: res.data.name || form.name,
      ownerName: form.ownerName,
      phone: form.phone,
      email: form.email,
      address: res.data.address || fullAddress,
      locality: res.data.locality || form.locality,
      city: res.data.city || form.city,
      state: res.data.state || form.state,
      pincode: res.data.pincode || form.pincode,
      latitude: res.data.latitude || form.latitude,
      longitude: res.data.longitude || form.longitude,
      isOpen: false,
      is_open: false,
      status: 'pending_approval',
      isPending: true,
      isApproved: false,
      image: res.data.image_url || form.image,
      image_url: res.data.image_url || form.image,
      openingTime: form.openingTime,
      closingTime: form.closingTime
    };

    setStoreProfile(newStoreObj);
    setHasStore(true);
    try {
      localStorage.setItem('gharsee_has_store', 'true');
      localStorage.setItem('gharsee_store_profile', JSON.stringify(newStoreObj));
    } catch {}

    addShopkeeperToast(`🎉 Store registration submitted! Awaiting Ghar See Admin approval.`, 'info');
  };

  // Handle Update Existing Store Details
  const handleUpdateStore = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullAddress = `${form.shopNumber ? form.shopNumber + ', ' : ''}${form.street ? form.street + ', ' : ''}${form.locality}, ${form.city}, ${form.state} - ${form.pincode}`;

    const success = await updateStoreInSupabase(storeProfile.id, {
      ...form,
      address: fullAddress,
      locality: form.locality,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      latitude: form.latitude,
      longitude: form.longitude,
      image: form.image,
      image_url: form.image
    });

    if (success) {
      updateStoreProfile({
        ...form,
        address: fullAddress,
        locality: form.locality,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude,
        longitude: form.longitude,
        image_url: form.image
      });
      setIsSubmitting(false);
      addShopkeeperToast('Store profile updated successfully in Supabase! ✨', 'success');
    } else {
      setIsSubmitting(false);
      setErrorMsg('Failed to update store in Supabase.');
      addShopkeeperToast('Store update failed.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>{isExistingStore ? 'MY STORE DETAILS' : 'CREATE YOUR STORE'}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {isExistingStore ? storeProfile.name : 'Register Your Grocery Store'}
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 font-medium">
              {isExistingStore 
                ? 'Manage your store photo, address, operating hours, and status visible to local customers'
                : 'Set up your grocery darkstore and storefront photo to start receiving online orders from customers in your locality'
              }
            </p>
          </div>

          {isExistingStore && (
            <button
              type="button"
              onClick={toggleStoreStatus}
              className={`py-3 px-5 rounded-2xl font-extrabold text-xs shadow-md transition-all ${
                storeProfile.isOpen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {storeProfile.isOpen ? 'CLOSE STORE NOW 🔴' : 'OPEN STORE NOW 🟢'}
            </button>
          )}
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-3xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-extrabold text-sm text-rose-950">Store Operation Failed</p>
            <p className="text-rose-700 font-medium mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* STORE FORM */}
      <form onSubmit={isExistingStore ? handleUpdateStore : handleCreateStore} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-8 shadow-xs">
        
        {/* SECTION 1: STORE BASIC INFO */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-base text-stone-900 border-b border-stone-100 pb-2">
            1. Basic Store Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Store Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sri Lakshmi Stores"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Shop Owner Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Store Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="Groceries & Fruits">Groceries & Fruits</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Organic Products">Organic Products</option>
                <option value="Dairy & Bakery">Dairy & Bakery</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: SHOP BANNER & STOREFRONT PHOTO (NEW) */}
        <div className="space-y-5 bg-[#FAF8F5] rounded-3xl p-5 sm:p-6 border border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-stone-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>2. Shop Photo & Storefront Banner</span>
              </h3>
              <p className="text-stone-500 text-xs mt-1">
                Upload your storefront photo or choose a curated template. This photo will be shown to customers in the local grocery marketplace.
              </p>
            </div>
            
            {imageInfo && (
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Ready ({imageInfo.sizeKb} KB)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: UPLOAD / DRAG & DROP AREA */}
            <div className="lg:col-span-7 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
                    : isCompressing
                    ? 'border-stone-300 bg-stone-100/80 cursor-wait'
                    : 'border-stone-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-3 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                    {isCompressing ? (
                      <Loader2 className="w-7 h-7 animate-spin text-emerald-700" />
                    ) : (
                      <UploadCloud className="w-7 h-7 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-stone-800">
                      {isCompressing ? 'Optimizing image for fast loading...' : 'Click to browse or drag & drop shop photo'}
                    </p>
                    <p className="text-xs text-stone-400 font-medium">
                      PNG, JPG, JPEG, WebP • Auto-optimized for crisp quality & fast speed
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>Browse From Device</span>
                    </button>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* CURATED PRESET OPTIONS */}
              <div className="space-y-2">
                <label className="block text-stone-700 text-xs font-bold">
                  Or pick a curated shop template:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_STORE_IMAGES.map((preset) => {
                    const isSelected = form.image === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`relative p-2 rounded-2xl border text-left transition-all flex items-center gap-2.5 overflow-hidden ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-stone-100"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-extrabold text-stone-900 truncate">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-stone-400 font-medium truncate">
                            {preset.category}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: LIVE PREVIEW & CUSTOMER SIMULATOR */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Customer Card Preview</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* SIMULATED CUSTOMER STORE CARD */}
                <div className="rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-50 shadow-xs">
                  <div className="relative w-full h-36 bg-stone-200 overflow-hidden">
                    <img
                      src={form.image || '/images/store_lakshmi.jpg'}
                      alt="Storefront Preview"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/images/store_lakshmi.jpg';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-emerald-800/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
                        🟢 Open
                      </span>
                      <span className="bg-white/95 text-stone-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                        ⭐ 5.0
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white space-y-1">
                    <h4 className="font-display font-extrabold text-stone-900 text-sm truncate">
                      {form.name.trim() || 'Your Store Name'}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium truncate">
                      {form.category} • {form.locality || 'Locality'}, {form.city || 'City'}
                    </p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span>⚡ Delivery after 4:00 PM</span>
                      <span className="text-stone-400">~1.2 km away</span>
                    </div>
                  </div>
                </div>

                {/* IMAGE ACTIONS */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-extrabold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="text-xs font-bold text-stone-400 hover:text-rose-600 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SHOP ADDRESS & LOCATION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
            <div>
              <h3 className="font-display font-extrabold text-base text-stone-900">
                3. Shop Address & Map Pinpoint
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Pinpoint your darkstore on map so customers nearby can find and order from you
              </p>
            </div>

            {/* PROMINENT "USE MY CURRENT LOCATION" (GPS) BUTTON */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-300 fill-emerald-300/30" />
              )}
              <span>📍 Use GPS Location</span>
            </button>
          </div>

          {locationStatusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locationStatusMsg}</span>
            </div>
          )}

          {/* SEARCH LOCALITY & LANDMARK AUTOCOMPLETE */}
          <div className="relative">
            <label className="block text-[11px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
              Search Area / Market / Landmark on Map
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Indiranagar, Koramangala, MG Road, Market Road..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-stone-200 shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-stone-100">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full p-2.5 text-left hover:bg-emerald-50/60 transition-colors flex items-start gap-2.5"
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

          {/* INTERACTIVE STORE LOCATION MAP EMBED */}
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
            <iframe
              title="Store Map View"
              src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&hl=en&z=16&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 border border-stone-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <p className="text-xs font-extrabold text-stone-900 truncate">
                  📍 {form.locality || 'Locality'}, {form.city || 'City'} ({form.pincode})
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md shrink-0">
                PINPOINTED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 font-bold mb-1">House / Shop No.</label>
              <input
                type="text"
                placeholder="e.g. Shop #12"
                value={form.shopNumber}
                onChange={(e) => setForm({ ...form, shopNumber: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Street / Road *</label>
              <input
                type="text"
                required
                placeholder="e.g. MG Road, 100 Feet Road"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Area / Locality *</label>
              <input
                type="text"
                required
                placeholder="e.g. Indiranagar, Koramangala, Market Road"
                value={form.locality}
                onChange={(e) => setForm({ ...form, locality: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru, Mysuru, Chikkamagaluru"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">State *</label>
              <input
                type="text"
                required
                placeholder="Karnataka"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Pincode *</label>
              <input
                type="text"
                required
                placeholder="560038"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: OPERATING HOURS & DETAILS */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-base text-stone-900 border-b border-stone-100 pb-2">
            4. Operating Hours & Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Opening Time *</label>
              <input
                type="text"
                required
                placeholder="07:00 AM"
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Closing Time *</label>
              <input
                type="text"
                required
                placeholder="10:00 PM"
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="py-4 px-8 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isExistingStore ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isExistingStore ? 'SAVE STORE DETAILS' : 'CREATE STORE IN SUPABASE'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
