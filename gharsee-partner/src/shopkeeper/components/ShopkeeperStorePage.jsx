import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { getCurrentPositionCoordinates } from '../../services/locationService';
import { createStoreInSupabase, updateStoreInSupabase } from '../../services/storeService';
import { Store, MapPin, Phone, Mail, Clock, Save, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShopkeeperStorePage() {
  const { storeProfile, authUser, setStoreProfile, setHasStore, updateStoreProfile, toggleStoreStatus, addShopkeeperToast, setActiveShopkeeperTab } = useShopkeeper();

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Detailed Address & Store Form State (NO visible latitude or longitude fields!)
  const [form, setForm] = useState({
    name: storeProfile?.name || '',
    ownerName: storeProfile?.ownerName || authUser?.user_metadata?.full_name || '',
    phone: storeProfile?.phone || authUser?.phone || authUser?.user_metadata?.phone || '',
    email: storeProfile?.email || authUser?.email || 'store@gharsee.app',
    shopNumber: '',
    street: '',
    locality: storeProfile?.locality || 'Chikkamagaluru',
    city: storeProfile?.city || 'Chikkamagaluru',
    state: storeProfile?.state || 'Karnataka',
    pincode: '577101',
    category: 'Groceries & Fruits',
    description: 'Fresh local grocery darkstore supplying neighborhood orders.',
    openingTime: storeProfile?.openingTime || '07:00 AM',
    closingTime: storeProfile?.closingTime || '10:00 PM',
    image: storeProfile?.image || '/images/store_lakshmi.jpg',
    latitude: storeProfile?.latitude || 13.3161,
    longitude: storeProfile?.longitude || 75.7720
  });

  const isExistingStore = Boolean(storeProfile && storeProfile.id);

  // Handle GPS location detection
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatusMsg(null);

    const coords = await getCurrentPositionCoordinates();
    setIsDetectingLocation(false);

    if (coords) {
      setForm(prev => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude
      }));
      setLocationStatusMsg(`📍 GPS Location Verified (${form.city}, ${form.state})`);
      addShopkeeperToast('GPS location detected successfully!', 'success');
    } else {
      addShopkeeperToast('Could not retrieve GPS location. Saved city coordinates.', 'info');
      setLocationStatusMsg(`📍 City Center Location Verified (${form.city})`);
    }
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
      latitude: form.latitude,
      longitude: form.longitude,
      image: form.image,
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
      locality: form.locality,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      latitude: res.data.latitude || form.latitude,
      longitude: res.data.longitude || form.longitude,
      isOpen: true,
      image: res.data.image_url || form.image,
      openingTime: form.openingTime,
      closingTime: form.closingTime
    };

    setStoreProfile(newStoreObj);
    setHasStore(true);

    addShopkeeperToast(`🎉 Store "${newStoreObj.name}" created successfully in Supabase!`, 'success');
    setActiveShopkeeperTab('dashboard');
  };

  // Handle Update Existing Store Details
  const handleUpdateStore = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullAddress = `${form.shopNumber ? form.shopNumber + ', ' : ''}${form.street ? form.street + ', ' : ''}${form.locality}, ${form.city}, ${form.state} - ${form.pincode}`;

    const success = await updateStoreInSupabase(storeProfile.id, {
      ...form,
      address: fullAddress
    });

    if (success) {
      updateStoreProfile({
        ...form,
        address: fullAddress
      });
      addShopkeeperToast('Store profile updated successfully!', 'success');
    } else {
      setErrorMsg('Failed to update store details in Supabase.');
      addShopkeeperToast('Failed to update store details in Supabase.', 'error');
    }

    setIsSubmitting(false);
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
                ? 'Manage your store address, operating hours, and status visible to local customers'
                : 'Set up your grocery darkstore to start receiving online orders from customers in your locality'
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

        {/* SECTION 2: SHOP ADDRESS & LOCATION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
            <h3 className="font-display font-extrabold text-base text-stone-900">
              2. Shop Address & Location
            </h3>

            {/* PROMINENT "USE MY CURRENT LOCATION" BUTTON */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-emerald-300" />}
              <span>📍 Use My Current Location</span>
            </button>
          </div>

          {locationStatusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locationStatusMsg}</span>
            </div>
          )}

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
                placeholder="e.g. MG Road, Market Junction"
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
                placeholder="e.g. Chikkamagaluru or Indiranagar"
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
                placeholder="e.g. Chikkamagaluru or Bengaluru"
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
                placeholder="577101"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: OPERATING HOURS & DETAILS */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-base text-stone-900 border-b border-stone-100 pb-2">
            3. Operating Hours & Schedule
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
            disabled={isSubmitting}
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
