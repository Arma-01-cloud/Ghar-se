import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateHaversineDistance, formatDistance, KNOWN_LOCALITY_LOOKUP } from './locationService';
import { generateUUID } from './authService';
import { STORES } from '../data/stores';

// Comprehensive Locality Coordinates Mapping for Chikkamagaluru & surrounding regions
const LOCALITY_COORDINATES = {
  'uppalli': { latitude: 13.3284, longitude: 75.7578, name: 'Uppalli, Chikkamagaluru' },
  'vijayapura': { latitude: 13.3210, longitude: 75.7820, name: 'Vijayapura, Chikkamagaluru' },
  'market road': { latitude: 13.3161, longitude: 75.7720, name: 'Market Road, Chikkamagaluru' },
  'ig road': { latitude: 13.3161, longitude: 75.7720, name: 'IG Road, Chikkamagaluru' },
  'mg road': { latitude: 13.3175, longitude: 75.7725, name: 'MG Road, Chikkamagaluru' },
  'rathnagiri': { latitude: 13.3245, longitude: 75.7780, name: 'Rathnagiri Road, Chikkamagaluru' },
  'km road': { latitude: 13.3280, longitude: 75.7650, name: 'KM Road, Chikkamagaluru' },
  'basavanahalli': { latitude: 13.3180, longitude: 75.7760, name: 'Basavanahalli, Chikkamagaluru' },
  'shankarpura': { latitude: 13.3140, longitude: 75.7680, name: 'Shankarpura, Chikkamagaluru' },
  'kalyan nagar': { latitude: 13.3315, longitude: 75.7830, name: 'Kalyan Nagar, Chikkamagaluru' },
  'housing board': { latitude: 13.3340, longitude: 75.7710, name: 'Housing Board Colony, Chikkamagaluru' },
  'khb': { latitude: 13.3340, longitude: 75.7710, name: 'Housing Board Colony, Chikkamagaluru' },
  'jyothi nagar': { latitude: 13.3320, longitude: 75.7610, name: 'Jyothi Nagar, Chikkamagaluru' },
  'dantaramakki': { latitude: 13.3260, longitude: 75.7920, name: 'Dantaramakki, Chikkamagaluru' },
  'ramanahalli': { latitude: 13.3080, longitude: 75.7850, name: 'Ramanahalli, Chikkamagaluru' },
  'bus stand': { latitude: 13.3195, longitude: 75.7745, name: 'Bus Stand Road, Chikkamagaluru' },
  'naidu street': { latitude: 13.3170, longitude: 75.7740, name: 'Naidu Street, Chikkamagaluru' },
  'chikkamagaluru': { latitude: 13.3161, longitude: 75.7720, name: 'Chikkamagaluru, Karnataka' },
  'chikmagalur': { latitude: 13.3161, longitude: 75.7720, name: 'Chikkamagaluru, Karnataka' }
};

const DEFAULT_SHOPKEEPER_PHONES = [
  '+91 81238 21300',
  '+91 77600 32354',
  '+91 91080 22641',
  '+91 86601 20584'
];

// Helper to reliably resolve a store's geographic coordinates
export function resolveStoreCoordinates(store) {
  if (store.latitude != null && store.longitude != null) {
    const lat = parseFloat(store.latitude);
    const lon = parseFloat(store.longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  const combinedText = `${store.locality || ''} ${store.city || ''} ${store.address || ''}`.toLowerCase();

  for (const [key, coords] of Object.entries(LOCALITY_COORDINATES)) {
    if (combinedText.includes(key)) {
      return { latitude: coords.latitude, longitude: coords.longitude };
    }
  }

  for (const loc of KNOWN_LOCALITY_LOOKUP) {
    if (combinedText.includes(loc.area.toLowerCase()) || combinedText.includes(loc.city.toLowerCase())) {
      return { latitude: loc.lat, longitude: loc.lon };
    }
  }

  return { latitude: null, longitude: null };
}

export async function fetchStores(customerLat = null, customerLon = null, localityName = '', cityName = '') {
  let shopRows = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*');

      if (!error && data && data.length > 0) {
        shopRows = data;
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local stores fallback:', err);
    }
  }

  if (shopRows.length === 0) {
    shopRows = STORES;
  }

  const approvedShopRows = shopRows.filter(s => {
    const st = (s.status || '').toLowerCase();
    if (st === 'pending' || st === 'pending_approval' || st === 'rejected' || s.is_approved === false) {
      return false;
    }
    return true;
  });

  const parsedCustomerLat = customerLat != null ? parseFloat(customerLat) : null;
  const parsedCustomerLon = customerLon != null ? parseFloat(customerLon) : null;
  const hasCustomerCoords = parsedCustomerLat != null && !isNaN(parsedCustomerLat) && parsedCustomerLon != null && !isNaN(parsedCustomerLon);

  const liveStores = approvedShopRows.map((s, idx) => {
    const coords = resolveStoreCoordinates(s);
    const shopLat = coords.latitude;
    const shopLon = coords.longitude;

    if ((s.latitude == null || s.longitude == null) && shopLat != null && shopLon != null && isSupabaseConfigured && s.id && typeof s.id === 'string' && s.id.length > 20) {
      supabase.from('shops').update({ latitude: shopLat, longitude: shopLon }).eq('id', s.id).catch?.(() => {});
    }

    let distKm = null;
    let formattedDist = null;
    let distanceBadge = 'Location required';

    if (hasCustomerCoords && shopLat != null && shopLon != null) {
      distKm = calculateHaversineDistance(parsedCustomerLat, parsedCustomerLon, shopLat, shopLon);
      formattedDist = formatDistance(distKm);
      distanceBadge = formattedDist ? `${formattedDist}` : 'Location required';
    }

    const dbPhone = s.phone || s.shopkeeper_phone || s.owner_phone;
    const shopkeeperPhone = dbPhone 
      ? (dbPhone.startsWith('+') ? dbPhone : `+91 ${dbPhone.replace(/\D/g, '').slice(-10)}`)
      : DEFAULT_SHOPKEEPER_PHONES[idx % DEFAULT_SHOPKEEPER_PHONES.length];

    const isStoreOpen = s.is_open != null 
      ? Boolean(s.is_open) 
      : (s.status ? (s.status.toLowerCase() === 'open' || s.status.toLowerCase() === 'active') : true);
    const statusText = isStoreOpen ? 'Open' : 'Closed';

    return {
      id: s.id,
      name: s.name,
      image: s.image || s.image_url || (idx % 2 === 0 ? '/images/store_lakshmi.jpg' : '/images/store_freshmart.jpg'),
      rating: s.rating || 4.8,
      reviews: s.reviews || (150 + idx * 45),
      isOpen: isStoreOpen,
      is_open: isStoreOpen,
      status: statusText,
      closingTime: s.closing_time || '10:00 PM',
      openingTime: s.opening_time || '07:00 AM',
      address: s.address || (s.locality ? `${s.locality}, ${s.city || 'Karnataka'}` : 'Market Road, Chikkamagaluru'),
      locality: s.locality || 'Local Area',
      city: s.city || 'Chikkamagaluru',
      state: s.state || 'Karnataka',
      pincode: s.pincode || '',
      latitude: shopLat,
      longitude: shopLon,
      phone: shopkeeperPhone,
      shopkeeperPhone: shopkeeperPhone,
      categories: s.categories || ['Groceries', 'Dairy & Eggs', 'Rice & Grains', 'Cooking Essentials'],
      distanceKm: distKm,
      formattedDistance: formattedDist,
      distanceText: formattedDist ? `${formattedDist} away` : 'Location required',
      distance: distanceBadge,
      deliveryTime: 'Delivery after 4:00 PM'
    };
  });

  let matchedStores = liveStores;
  const locQuery = `${localityName || ''} ${cityName || ''}`.toLowerCase().trim();
  const searchTokens = locQuery.split(/[\s,/-]+/).filter(t => t.length > 2);

  if (hasCustomerCoords) {
    const nearbyStores = liveStores.filter(store => {
      if (store.distanceKm != null && store.distanceKm <= 45) {
        return true;
      }
      const storeText = `${store.locality} ${store.city} ${store.address}`.toLowerCase();
      if (searchTokens.some(token => storeText.includes(token))) {
        return true;
      }
      return false;
    });

    if (nearbyStores.length > 0) {
      matchedStores = nearbyStores;
    } else if (searchTokens.length > 0) {
      matchedStores = liveStores.filter(store => {
        const storeText = `${store.locality} ${store.city} ${store.address}`.toLowerCase();
        return searchTokens.some(token => storeText.includes(token));
      });
    }
  } else if (searchTokens.length > 0) {
    const textMatched = liveStores.filter(store => {
      const storeText = `${store.locality} ${store.city} ${store.address}`.toLowerCase();
      return searchTokens.some(token => storeText.includes(token));
    });
    if (textMatched.length > 0) {
      matchedStores = textMatched;
    }
  }

  matchedStores.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm != null) return -1;
    if (b.distanceKm != null) return 1;
    return 0;
  });

  return { stores: matchedStores, error: null };
}

// Create a new store in Supabase shops table with owner_id foreign key safety
export async function createStoreInSupabase(storeData, fallbackUser = null) {
  if (!isSupabaseConfigured) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const storePhone = storeData.phone || storeData.shopkeeperPhone || '8123821300';
    const storeLocality = storeData.locality || (storeData.address?.split(',')[0]?.trim()) || 'Local Area';
    const storeCity = storeData.city || (storeData.address?.split(',')[1]?.trim()) || 'Chikkamagaluru';
    const storeState = storeData.state || 'Karnataka';
    const storePincode = storeData.pincode || '577101';

    const coords = resolveStoreCoordinates({
      latitude: storeData.latitude,
      longitude: storeData.longitude,
      locality: storeLocality,
      city: storeCity,
      address: storeData.address
    });

    const finalLat = coords.latitude != null ? coords.latitude : (storeCity.toLowerCase().includes('bengaluru') ? 12.9784 : 13.3161);
    const finalLon = coords.longitude != null ? coords.longitude : (storeCity.toLowerCase().includes('bengaluru') ? 77.6408 : 75.7720);

    const ownerId = fallbackUser?.id || storeData.owner_id || null;

    // 1. If ownerId is provided, guarantee profile row exists in public.profiles first
    if (ownerId) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: ownerId,
            phone: storePhone,
            full_name: storeData.ownerName || 'Store Partner',
            role: 'shopkeeper',
            updated_at: new Date().toISOString()
          });
      } catch (profErr) {
        console.warn('Profile ensure non-fatal warning:', profErr);
      }
    }

    // 2. Primary Insert with owner_id
    const payload = {
      owner_id: ownerId,
      name: storeData.name,
      phone: storePhone,
      address: storeData.address,
      locality: storeLocality,
      city: storeCity,
      state: storeState,
      pincode: storePincode,
      latitude: finalLat,
      longitude: finalLon,
      rating: 5.0,
      is_open: false,
      status: 'pending_approval',
      image_url: storeData.image || storeData.image_url || '/images/store_lakshmi.jpg'
    };

    const { data, error } = await supabase
      .from('shops')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Primary shop insert failed, retrying with foreign-key resilience:', error.message);

      const isFkError = Boolean(
        error.message?.includes('foreign key') || 
        error.message?.includes('shops_owner_id_fkey') ||
        error.code === '23503'
      );

      const safeOwnerId = isFkError ? null : ownerId;

      const fallbackPayload = {
        owner_id: safeOwnerId,
        name: storeData.name,
        phone: storePhone,
        address: storeData.address,
        locality: storeLocality,
        city: storeCity,
        state: storeState,
        pincode: storePincode,
        latitude: finalLat,
        longitude: finalLon,
        status: 'pending_approval',
        is_open: false,
        image_url: storeData.image || storeData.image_url || '/images/store_lakshmi.jpg'
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('shops')
        .insert([fallbackPayload])
        .select();

      if (retryErr) {
        console.error('Final fallback shop insert failed:', retryErr.message);
        return { data: null, error: retryErr.message };
      }

      const createdObj = (retryData && retryData[0]) ? retryData[0] : { id: generateUUID(), ...fallbackPayload };

      // Background link owner_id if it was created with null due to FK constraint race
      if (ownerId && createdObj.id && !createdObj.owner_id) {
        setTimeout(async () => {
          try {
            await supabase.from('shops').update({ owner_id: ownerId }).eq('id', createdObj.id);
          } catch {}
        }, 500);
      }

      return { data: createdObj, error: null };
    }

    return { data, error: null };
  } catch (err) {
    console.error('SHOP CREATION EXCEPTION:', err);
    return { data: null, error: err.message || 'Unexpected exception during shop creation' };
  }
}

// Update store profile & status in Supabase
export async function updateStoreInSupabase(storeId, updatedFields) {
  if (!isSupabaseConfigured) return true;
  if (!storeId) return false;

  try {
    const payload = {
      updated_at: new Date().toISOString()
    };
    if (updatedFields.name) payload.name = updatedFields.name;
    if (updatedFields.phone) payload.phone = updatedFields.phone;
    if (updatedFields.owner_id || updatedFields.ownerId) payload.owner_id = updatedFields.owner_id || updatedFields.ownerId;
    if (updatedFields.address) payload.address = updatedFields.address;
    if (updatedFields.locality) payload.locality = updatedFields.locality;
    if (updatedFields.city) payload.city = updatedFields.city;
    if (updatedFields.state) payload.state = updatedFields.state;
    if (updatedFields.pincode) payload.pincode = updatedFields.pincode;
    if (updatedFields.latitude != null) payload.latitude = parseFloat(updatedFields.latitude);
    if (updatedFields.longitude != null) payload.longitude = parseFloat(updatedFields.longitude);
    if (updatedFields.image || updatedFields.image_url) payload.image_url = updatedFields.image || updatedFields.image_url;
    if (updatedFields.isOpen != null) {
      payload.is_open = Boolean(updatedFields.isOpen);
      if (!updatedFields.status) {
        payload.status = updatedFields.isOpen ? 'open' : 'closed';
      }
    }
    if (updatedFields.status) payload.status = updatedFields.status;

    const { error } = await supabase
      .from('shops')
      .update(payload)
      .eq('id', storeId);

    if (error) {
      console.warn('Supabase store update error, retrying with minimal payload:', error.message);
      const minimalPayload = {};
      if (updatedFields.isOpen != null) {
        minimalPayload.is_open = Boolean(updatedFields.isOpen);
        minimalPayload.status = updatedFields.isOpen ? 'open' : 'closed';
      }
      const { error: err2 } = await supabase
        .from('shops')
        .update(minimalPayload)
        .eq('id', storeId);
      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception updating store in Supabase:', err);
    return false;
  }
}

export async function updateStoreStatus(storeId, isOpen) {
  return updateStoreInSupabase(storeId, { 
    isOpen: Boolean(isOpen), 
    status: isOpen ? 'open' : 'closed' 
  });
}