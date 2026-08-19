import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateHaversineDistance } from './locationService';
import { generateUUID } from './authService';

// Extensible Locality Coordinates Mapping
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

export async function fetchStores(customerLat = 13.3161, customerLon = 75.7720, localityName = '') {
  if (!isSupabaseConfigured) {
    return { stores: [], error: 'Supabase credentials not configured' };
  }

  try {
    const { data: shopRows, error } = await supabase
      .from('shops')
      .select('*');

    if (error || !shopRows || shopRows.length === 0) {
      return { stores: [], error: null };
    }

    // Only display stores that are approved by Admin and not pending/rejected
    const approvedShopRows = shopRows.filter(s => {
      const st = (s.status || '').toLowerCase();
      if (st === 'pending' || st === 'pending_approval' || st === 'rejected' || s.is_approved === false) {
        return false;
      }
      return true;
    });

    const liveStores = approvedShopRows.map((s, idx) => {
      const addressLower = (s.address || '').toLowerCase();
      let shopLat = s.latitude;
      let shopLon = s.longitude;

      if (shopLat == null || shopLon == null) {
        for (const [key, coords] of Object.entries(LOCALITY_COORDINATES)) {
          if (addressLower.includes(key)) {
            shopLat = coords.latitude;
            shopLon = coords.longitude;
            break;
          }
        }
      }

      if (shopLat == null || shopLon == null) {
        shopLat = customerLat + (idx * 0.006);
        shopLon = customerLon + (idx * 0.005);
      }

      const distKm = calculateHaversineDistance(customerLat, customerLon, shopLat, shopLon);
      const estMinutes = Math.max(10, Math.round(distKm * 6 + 12));

      // Extract exact store phone number directly from Supabase shop record
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
        image: s.image_url || (idx % 2 === 0 ? '/images/store_lakshmi.jpg' : '/images/store_freshmart.jpg'),
        rating: s.rating || 5.0,
        reviews: s.reviews || (150 + idx * 45),
        isOpen: isStoreOpen,
        is_open: isStoreOpen,
        status: statusText,
        closingTime: s.closing_time || '10:00 PM',
        openingTime: s.opening_time || '07:00 AM',
        address: s.address || (localityName ? `Market Road, ${localityName}` : 'Chikkamagaluru, Karnataka'),
        latitude: shopLat,
        longitude: shopLon,
        phone: shopkeeperPhone,
        shopkeeperPhone: shopkeeperPhone,
        categories: s.categories || ['Groceries', 'Dairy & Eggs', 'Rice & Grains', 'Cooking Essentials'],
        distanceKm: distKm,
        distance: `~${distKm} km away`,
        deliveryTime: 'Delivery after 4:00 PM'
      };
    });

    liveStores.sort((a, b) => a.distanceKm - b.distanceKm);
    return { stores: liveStores, error: null };
  } catch (err) {
    console.error('Exception fetching shops:', err);
    return { stores: [], error: 'Unable to load local stores. Please try again.' };
  }
}

// Create a new store in Supabase shops table (No owner_id field to prevent foreign key violations!)
export async function createStoreInSupabase(storeData, fallbackUser = null) {
  if (!isSupabaseConfigured) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const storePhone = storeData.phone || storeData.shopkeeperPhone || '8123821300';
    const storeLocality = storeData.locality || (storeData.address?.split(',')[0]?.trim()) || 'Local Area';
    const storeCity = storeData.city || (storeData.address?.split(',')[1]?.trim()) || 'Bengaluru';
    const storeState = storeData.state || 'Karnataka';
    const storePincode = storeData.pincode || '';

    // Pure store payload WITHOUT owner_id to avoid foreign key constraints!
    const payload = {
      name: storeData.name,
      phone: storePhone,
      address: storeData.address,
      locality: storeLocality,
      city: storeCity,
      state: storeState,
      pincode: storePincode,
      password: storeData.password || null,
      latitude: storeData.latitude != null ? parseFloat(storeData.latitude) : 12.9784,
      longitude: storeData.longitude != null ? parseFloat(storeData.longitude) : 77.6408,
      rating: 5.0,
      is_open: false,
      is_approved: false,
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
        latitude: storeData.latitude != null ? parseFloat(storeData.latitude) : 12.9784,
        longitude: storeData.longitude != null ? parseFloat(storeData.longitude) : 77.6408,
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
  if (!storeId) return false;

  try {
    const payload = {
      updated_at: new Date().toISOString()
    };
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

    return !error;
  } catch {
    return false;
  }
}

export async function updateStoreStatus(storeId, isOpen) {
  return updateStoreInSupabase(storeId, { 
    isOpen: Boolean(isOpen), 
    status: isOpen ? 'open' : 'closed' 
  });
}
