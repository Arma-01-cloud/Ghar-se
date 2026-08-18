import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateHaversineDistance, formatDistance, KNOWN_LOCALITY_LOOKUP } from './locationService';
import { generateUUID } from './authService';
import { STORES } from '../data/stores';

// Comprehensive Locality Coordinates Mapping for Karnataka & nearby regions
const LOCALITY_COORDINATES = {
  'chikkamagaluru': { latitude: 13.3161, longitude: 75.7720, name: 'Chikkamagaluru, Karnataka' },
  'chikmagalur': { latitude: 13.3161, longitude: 75.7720, name: 'Chikkamagaluru, Karnataka' },
  'market road': { latitude: 13.3161, longitude: 75.7720, name: 'Market Road, Chikkamagaluru' },
  'rathnagiri': { latitude: 13.3245, longitude: 75.7780, name: 'Rathnagiri Road, Chikkamagaluru' },
  'uppalli': { latitude: 13.3284, longitude: 75.7578, name: 'Uppalli, Chikkamagaluru' },
  'km road': { latitude: 13.3280, longitude: 75.7650, name: 'KM Road, Chikkamagaluru' },
  'bengaluru': { latitude: 12.9716, longitude: 77.5946, name: 'Bengaluru, Karnataka' },
  'bangalore': { latitude: 12.9716, longitude: 77.5946, name: 'Bengaluru, Karnataka' },
  'indiranagar': { latitude: 12.9784, longitude: 77.6408, name: 'Indiranagar, Bengaluru' },
  'koramangala': { latitude: 12.9352, longitude: 77.6245, name: 'Koramangala, Bengaluru' },
  'hal': { latitude: 12.9620, longitude: 77.6580, name: 'HAL 2nd Stage, Bengaluru' },
  'whitefield': { latitude: 12.9698, longitude: 77.7500, name: 'Whitefield, Bengaluru' },
  'hsr layout': { latitude: 12.9121, longitude: 77.6446, name: 'HSR Layout, Bengaluru' },
  'mg road': { latitude: 12.9756, longitude: 77.6066, name: 'MG Road, Bengaluru' },
  'mysuru': { latitude: 12.2958, longitude: 76.6394, name: 'Mysuru, Karnataka' },
  'mysore': { latitude: 12.2958, longitude: 76.6394, name: 'Mysuru, Karnataka' },
  'mangaluru': { latitude: 12.9141, longitude: 74.8560, name: 'Mangaluru, Karnataka' },
  'mangalore': { latitude: 12.9141, longitude: 74.8560, name: 'Mangaluru, Karnataka' },
  'hubballi': { latitude: 15.3647, longitude: 75.1240, name: 'Hubballi, Karnataka' }
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

  // If no stores in Supabase, fall back to initial local stores
  if (shopRows.length === 0) {
    shopRows = STORES;
  }

  // Filter out stores pending approval or rejected
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

  // Map and calculate real distances for every store
  const liveStores = approvedShopRows.map((s, idx) => {
    const coords = resolveStoreCoordinates(s);
    const shopLat = coords.latitude;
    const shopLon = coords.longitude;

    // Asynchronously backfill coordinates to Supabase if missing in database
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

    return {
      id: s.id,
      name: s.name,
      image: s.image || s.image_url || (idx % 2 === 0 ? '/images/store_lakshmi.jpg' : '/images/store_freshmart.jpg'),
      rating: s.rating || 4.8,
      reviews: s.reviews || (150 + idx * 45),
      isOpen: s.status === 'open' || s.status === 'active' || true,
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

  // Locality Matching & Discovery Filter:
  // If customer has a selected locality or coordinates, filter to relevant stores within delivery range (<= 45 km) or matching locality/city tokens
  let matchedStores = liveStores;

  const locQuery = `${localityName || ''} ${cityName || ''}`.toLowerCase().trim();
  const searchTokens = locQuery.split(/[\s,/-]+/).filter(t => t.length > 2);

  if (hasCustomerCoords) {
    // 1. First find stores with real distance within 45 km radius OR matching locality/city tokens
    const nearbyStores = liveStores.filter(store => {
      // Direct distance proximity
      if (store.distanceKm != null && store.distanceKm <= 45) {
        return true;
      }
      // Locality / city text match
      const storeText = `${store.locality} ${store.city} ${store.address}`.toLowerCase();
      if (searchTokens.some(token => storeText.includes(token))) {
        return true;
      }
      return false;
    });

    if (nearbyStores.length > 0) {
      matchedStores = nearbyStores;
    } else if (searchTokens.length > 0) {
      // If none within 45km, only match if explicit locality match exists, otherwise return empty (no far-away stores)
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

  // Sort matched stores strictly by real geographic distance (Nearest First)
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

// Create a new store in Supabase shops table
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

    // Resolve accurate coordinates
    const coords = resolveStoreCoordinates({
      latitude: storeData.latitude,
      longitude: storeData.longitude,
      locality: storeLocality,
      city: storeCity,
      address: storeData.address
    });

    const finalLat = coords.latitude != null ? coords.latitude : (storeCity.toLowerCase().includes('bengaluru') ? 12.9784 : 13.3161);
    const finalLon = coords.longitude != null ? coords.longitude : (storeCity.toLowerCase().includes('bengaluru') ? 77.6408 : 75.7720);

    const payload = {
      name: storeData.name,
      phone: storePhone,
      address: storeData.address,
      locality: storeLocality,
      city: storeCity,
      state: storeState,
      pincode: storePincode,
      password: storeData.password || null,
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
      console.error('SHOP CREATION SUPABASE ERROR:', error.message);

      const minimalPayload = {
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
        .insert([minimalPayload])
        .select();

      if (retryErr) {
        return { data: null, error: retryErr.message };
      }

      const createdObj = (retryData && retryData[0]) ? retryData[0] : { id: generateUUID(), ...minimalPayload };
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

  try {
    const payload = {};
    if (updatedFields.name) payload.name = updatedFields.name;
    if (updatedFields.phone) payload.phone = updatedFields.phone;
    if (updatedFields.address) payload.address = updatedFields.address;
    if (updatedFields.locality) payload.locality = updatedFields.locality;
    if (updatedFields.city) payload.city = updatedFields.city;
    if (updatedFields.state) payload.state = updatedFields.state;
    if (updatedFields.pincode) payload.pincode = updatedFields.pincode;
    if (updatedFields.password) payload.password = updatedFields.password;
    if (updatedFields.latitude != null) payload.latitude = parseFloat(updatedFields.latitude);
    if (updatedFields.longitude != null) payload.longitude = parseFloat(updatedFields.longitude);
    if (updatedFields.image || updatedFields.image_url) payload.image_url = updatedFields.image || updatedFields.image_url;
    if (updatedFields.isOpen != null) payload.is_open = updatedFields.isOpen;
    if (updatedFields.status) payload.status = updatedFields.status;

    const { error } = await supabase
      .from('shops')
      .update(payload)
      .eq('id', storeId);

    return !error;
  } catch {
    return false;
  }
}

export async function updateStoreStatus(storeId, isOpen) {
  return updateStoreInSupabase(storeId, { isOpen });
}
