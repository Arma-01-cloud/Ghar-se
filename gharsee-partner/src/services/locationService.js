import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Calculate Geographic Distance using Haversine Formula (Returns distance in kilometers)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 1.5; // Default distance fallback
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Browser Geolocation API wrapper with Promise & Error handling
export function getCurrentPositionCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'NOT_SUPPORTED', message: 'Location services are currently unavailable in your browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject({ code: 'PERMISSION_DENIED', message: 'Location permission is required to find stores near you. Please enable location in your browser settings.' });
            break;
          case error.POSITION_UNAVAILABLE:
            reject({ code: 'POSITION_UNAVAILABLE', message: 'GPS location is currently unavailable.' });
            break;
          case error.TIMEOUT:
            reject({ code: 'TIMEOUT', message: 'Location detection timed out. Please try again or search manually.' });
            break;
          default:
            reject({ code: 'UNKNOWN_ERROR', message: 'Unable to detect location. Please select your area manually.' });
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// Comprehensive Reference Localities table for instant offline fallback
const KNOWN_LOCALITY_LOOKUP = [
  { name: 'Indiranagar, Bengaluru', area: 'Indiranagar', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', lat: 12.9784, lon: 77.6408 },
  { name: 'Koramangala, Bengaluru', area: 'Koramangala', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', lat: 12.9352, lon: 77.6245 },
  { name: 'Whitefield, Bengaluru', area: 'Whitefield', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', lat: 12.9698, lon: 77.7500 },
  { name: 'HSR Layout, Bengaluru', area: 'HSR Layout', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560102', lat: 12.9121, lon: 77.6446 },
  { name: 'HAL 2nd Stage, Bengaluru', area: 'HAL 2nd Stage', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560008', lat: 12.9620, lon: 77.6580 },
  { name: 'MG Road, Bengaluru', area: 'MG Road / Central Bengaluru', district: 'Bengaluru Urban', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', lat: 12.9756, lon: 77.6066 },
  { name: 'Market Road, Chikkamagaluru', area: 'Market Road / IG Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3161, lon: 75.7720 },
  { name: 'Rathnagiri Road, Chikkamagaluru', area: 'Rathnagiri Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3245, lon: 75.7780 },
  { name: 'Jayachamarajendra Nagar, Mysuru', area: 'JC Nagar', district: 'Mysuru', city: 'Mysuru', state: 'Karnataka', pincode: '570010', lat: 12.2958, lon: 76.6394 },
  { name: 'Hampankatta, Mangaluru', area: 'Hampankatta', district: 'Dakshina Kannada', city: 'Mangaluru', state: 'Karnataka', pincode: '575001', lat: 12.9141, lon: 74.8560 },
  { name: 'Vidyanagar, Hubballi', area: 'Vidyanagar', district: 'Dharwad', city: 'Hubballi', state: 'Karnataka', pincode: '580021', lat: 15.3647, lon: 75.1240 }
];

function getNearestKnownLocality(lat, lon) {
  let best = KNOWN_LOCALITY_LOOKUP[0];
  let minDistance = calculateHaversineDistance(lat, lon, best.lat, best.lon);

  for (let i = 1; i < KNOWN_LOCALITY_LOOKUP.length; i++) {
    const loc = KNOWN_LOCALITY_LOOKUP[i];
    const dist = calculateHaversineDistance(lat, lon, loc.lat, loc.lon);
    if (dist < minDistance) {
      minDistance = dist;
      best = loc;
    }
  }

  return {
    name: best.name,
    area: best.area,
    district: best.district,
    city: best.city,
    state: best.state,
    pincode: best.pincode,
    formattedAddress: `${best.area}, ${best.city}, ${best.state} - ${best.pincode}`,
    latitude: lat,
    longitude: lon
  };
}

// Convert GPS coordinates into human-readable Area, District, State, Pincode
export async function reverseGeocodeCoordinates(lat, lon) {
  if (lat == null || lon == null) {
    return KNOWN_LOCALITY_LOOKUP[0];
  }

  // 1. Try BigDataCloud Reverse Geocoding Client API (Fast, Free, CORS enabled)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const area = data.locality || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name || data.city || '';
      const district = data.localityInfo?.administrative?.[2]?.name || data.principalSubdivision || data.city || 'District';
      const city = data.city || data.locality || district;
      const state = data.principalSubdivision || 'Karnataka';
      const pincode = data.postcode || '577101';

      const cleanArea = area.replace(/District|Taluk/gi, '').trim();
      const cleanCity = city.replace(/District|Taluk/gi, '').trim();
      const cleanDistrict = district.replace(/Taluk/gi, '').trim();

      const shortTitle = cleanArea && cleanArea !== cleanCity ? `${cleanArea}, ${cleanCity}` : `${cleanCity}, ${state}`;
      const fullAddr = `${cleanArea ? cleanArea + ', ' : ''}${cleanCity}, ${cleanDistrict && cleanDistrict !== cleanCity ? cleanDistrict + ', ' : ''}${state} - ${pincode}`.trim();

      return {
        name: shortTitle,
        area: cleanArea || cleanCity,
        district: cleanDistrict || cleanCity,
        city: cleanCity,
        state: state,
        pincode: pincode,
        formattedAddress: fullAddr,
        latitude: lat,
        longitude: lon
      };
    }
  } catch {
    // Fallthrough to OSM Nominatim
  }

  // 2. Try OpenStreetMap Nominatim Reverse Geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      }
    );
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const data = await osmRes.json();
      const addr = data.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.town || addr.hamlet || '';
      const district = addr.state_district || addr.county || addr.city_district || addr.city || '';
      const city = addr.city || addr.town || addr.municipality || district || 'Chikkamagaluru';
      const state = addr.state || 'Karnataka';
      const pincode = addr.postcode || '577101';

      const shortName = area ? `${area}, ${city}` : (data.name || `${city}, ${state}`);
      const fullAddr = [addr.road, area, city, district, state, pincode].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

      return {
        name: shortName,
        area: area || city,
        district: district || city,
        city: city,
        state: state,
        pincode: pincode,
        formattedAddress: fullAddr || shortName,
        latitude: lat,
        longitude: lon
      };
    }
  } catch {
    // Fallthrough
  }

  // 3. Fallback to nearest mapped locality
  return getNearestKnownLocality(lat, lon);
}

// Search Places & Localities with live autocomplete
export async function searchLocationPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&addressdetails=1&limit=6&countrycodes=in`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const list = await res.json();
      if (list && list.length > 0) {
        return list.map(item => {
          const addr = item.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.town || item.name || '';
          const city = addr.city || addr.town || addr.municipality || addr.state_district || 'City';
          const state = addr.state || 'Karnataka';
          const district = addr.state_district || addr.county || city;
          const pincode = addr.postcode || '';

          const title = area ? `${area}, ${city}` : (item.name || `${city}, ${state}`);

          return {
            id: String(item.place_id),
            name: title,
            area: area || item.name || city,
            district: district,
            city: city,
            state: state,
            pincode: pincode,
            formattedAddress: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          };
        });
      }
    }
  } catch {
    // Fallthrough
  }

  const qLower = query.toLowerCase();
  return KNOWN_LOCALITY_LOOKUP
    .filter(loc => loc.name.toLowerCase().includes(qLower) || loc.area.toLowerCase().includes(qLower) || loc.city.toLowerCase().includes(qLower))
    .map((loc, idx) => ({
      id: `local-${idx}`,
      name: loc.name,
      area: loc.area,
      district: loc.district,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      formattedAddress: loc.formattedAddress,
      latitude: loc.lat,
      longitude: loc.lon
    }));
}

// Get GPS position and immediately reverse-geocode into human-readable components
export async function getCurrentPositionWithAddress() {
  const coords = await getCurrentPositionCoordinates();
  const addressDetails = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
  return {
    ...addressDetails,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy
  };
}

// Fetch saved address for a customer by mobile phone number
export async function fetchCustomerAddressByPhone(phone) {
  if (!isSupabaseConfigured || !phone) return null;

  try {
    const normalized = phone.replace(/\D/g, '');
    const searchPhone = normalized.length === 10 ? `+91${normalized}` : (phone.startsWith('+') ? phone : `+${normalized}`);

    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('phone', searchPhone)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Save or update customer address keyed by mobile phone number
export async function saveCustomerPhoneAddress({ phone, fullName, flat, street, city = 'Bengaluru', pincode, latitude, longitude, addressText }) {
  if (!isSupabaseConfigured || !phone) return null;

  try {
    const normalized = phone.replace(/\D/g, '');
    const searchPhone = normalized.length === 10 ? `+91${normalized}` : (phone.startsWith('+') ? phone : `+${normalized}`);

    // First ensure profile exists
    await supabase.from('profiles').upsert({
      phone: searchPhone,
      role: 'customer',
      full_name: fullName || 'Customer'
    }, { onConflict: 'phone' });

    const payload = {
      phone: searchPhone,
      full_name: fullName || 'Customer',
      flat: flat || '',
      street: street || '',
      city: city || 'Bengaluru',
      pincode: pincode || '',
      latitude: latitude || 12.9784,
      longitude: longitude || 77.6408,
      address_text: addressText || `${flat || ''} ${street || ''}, ${city}`.trim()
    };

    const { data, error } = await supabase
      .from('customer_addresses')
      .upsert(payload, { onConflict: 'phone' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving customer address:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Exception saving customer address:', err);
    return null;
  }
}

// Fetch saved addresses from Supabase addresses table
export async function fetchSavedAddresses(userId) {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// Save user address to Supabase addresses table
export async function saveUserAddress(addressRecord) {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert([addressRecord])
      .select()
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
