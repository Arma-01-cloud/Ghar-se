import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from './authService';

// Calculate Geographic Distance using Haversine Formula (Returns distance in kilometers or null if unavailable)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const nLat1 = parseFloat(lat1);
  const nLon1 = parseFloat(lon1);
  const nLat2 = parseFloat(lat2);
  const nLon2 = parseFloat(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
      Math.cos(nLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Exact distance in km with high precision
}

// Format distance cleanly: <1 km displayed in meters, >=1 km displayed in km with 1 decimal precision
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm < 0) {
    return null;
  }

  const num = parseFloat(distanceKm);
  if (isNaN(num)) return null;

  if (num < 1) {
    // Meters format: rounded to nearest meter (e.g. 350 m, 800 m, 850 m)
    const meters = Math.round(num * 1000);
    return `${meters} m`;
  }

  if (num < 100) {
    // Kilometers format with 1 decimal precision (e.g. 1.2 km, 3.7 km, 12.4 km)
    return `${num.toFixed(1)} km`;
  }

  return `${Math.round(num)} km`;
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
export const KNOWN_LOCALITY_LOOKUP = [
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

// Robust Address to Geographic Coordinates Resolver
export function resolveAddressCoordinates(addressText = '', area = '', city = '') {
  const combined = `${addressText || ''} ${area || ''} ${city || ''}`.toLowerCase();

  if (combined.includes('uppalli')) {
    return { latitude: 13.3284, longitude: 75.7578, city: 'Chikkamagaluru', area: 'Uppalli' };
  }
  if (combined.includes('rathnagiri')) {
    return { latitude: 13.3245, longitude: 75.7780, city: 'Chikkamagaluru', area: 'Rathnagiri Road' };
  }
  if (combined.includes('market road') || combined.includes('ig road')) {
    return { latitude: 13.3161, longitude: 75.7720, city: 'Chikkamagaluru', area: 'Market Road' };
  }
  if (combined.includes('km road')) {
    return { latitude: 13.3280, longitude: 75.7650, city: 'Chikkamagaluru', area: 'KM Road' };
  }
  if (combined.includes('bus stand road') || combined.includes('bus stand')) {
    return { latitude: 13.3195, longitude: 75.7745, city: 'Chikkamagaluru', area: 'Bus Stand Road' };
  }
  if (combined.includes('chikmagalur') || combined.includes('chikkamagaluru') || combined.includes('chikkamanglur') || combined.includes('577101')) {
    return { latitude: 13.3161, longitude: 75.7720, city: 'Chikkamagaluru', area: 'Chikkamagaluru' };
  }
  if (combined.includes('indiranagar')) {
    return { latitude: 12.9784, longitude: 77.6408, city: 'Bengaluru', area: 'Indiranagar' };
  }
  if (combined.includes('koramangala')) {
    return { latitude: 12.9352, longitude: 77.6245, city: 'Bengaluru', area: 'Koramangala' };
  }
  if (combined.includes('whitefield')) {
    return { latitude: 12.9698, longitude: 77.7500, city: 'Bengaluru', area: 'Whitefield' };
  }
  if (combined.includes('hsr layout') || combined.includes('hsr')) {
    return { latitude: 12.9121, longitude: 77.6446, city: 'Bengaluru', area: 'HSR Layout' };
  }
  if (combined.includes('hal')) {
    return { latitude: 12.9620, longitude: 77.6580, city: 'Bengaluru', area: 'HAL 2nd Stage' };
  }
  if (combined.includes('mysuru') || combined.includes('mysore')) {
    return { latitude: 12.2958, longitude: 76.6394, city: 'Mysuru', area: 'JC Nagar' };
  }
  if (combined.includes('mangaluru') || combined.includes('mangalore')) {
    return { latitude: 12.9141, longitude: 74.8560, city: 'Mangaluru', area: 'Hampankatta' };
  }
  if (combined.includes('hubballi') || combined.includes('hubli')) {
    return { latitude: 15.3647, longitude: 75.1240, city: 'Hubballi', area: 'Vidyanagar' };
  }
  if (combined.includes('bengaluru') || combined.includes('bangalore') || combined.includes('5600')) {
    return { latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', area: 'Central Bengaluru' };
  }

  // Fallback to reference lookup table
  for (const loc of KNOWN_LOCALITY_LOOKUP) {
    if (combined.includes(loc.area.toLowerCase()) || combined.includes(loc.city.toLowerCase())) {
      return { latitude: loc.lat, longitude: loc.lon, city: loc.city, area: loc.area };
    }
  }

  return { latitude: 13.3161, longitude: 75.7720, city: 'Chikkamagaluru', area: 'Local Area' };
}

// Fetch saved customer address and profile from Supabase by 10-digit phone number
export async function fetchCustomerAddressByPhone(phone) {
  if (!isSupabaseConfigured || !phone) return null;

  try {
    const cleanDigits = get10DigitPhone(phone);
    if (!cleanDigits || cleanDigits.length < 10) return null;

    // 1. Fetch profiles table to see if user exists and get full_name
    const { data: profiles } = await supabase.from('profiles').select('*');
    const matchedProfile = (profiles || []).find(p => get10DigitPhone(p.phone) === cleanDigits);

    // 2. Fetch customer_addresses table
    const { data: addresses } = await supabase.from('customer_addresses').select('*');
    const matchedAddress = (addresses || []).find(a => get10DigitPhone(a.phone) === cleanDigits);

    if (matchedAddress || matchedProfile) {
      const rawAddressText = matchedAddress?.address_text || '';
      let lat = matchedAddress?.latitude != null ? parseFloat(matchedAddress.latitude) : null;
      let lon = matchedAddress?.longitude != null ? parseFloat(matchedAddress.longitude) : null;
      let resolvedCity = matchedAddress?.city || 'Chikkamagaluru';

      // Detect and self-heal coordinate corruption (e.g., Chikkamagaluru address stored with Bengaluru coords)
      const textLower = `${rawAddressText} ${matchedAddress?.street || ''} ${matchedAddress?.city || ''}`.toLowerCase();
      const isChik = textLower.includes('chikmagalur') || textLower.includes('chikkamagaluru') || textLower.includes('uppalli') || textLower.includes('577101');
      const isBlr = textLower.includes('bengaluru') || textLower.includes('bangalore') || textLower.includes('indiranagar') || textLower.includes('koramangala');

      if ((isChik && lat != null && lat < 13.1) || (isBlr && lat != null && lat > 13.1) || lat == null || lon == null) {
        const resolved = resolveAddressCoordinates(rawAddressText, matchedAddress?.street, matchedAddress?.city);
        lat = resolved.latitude;
        lon = resolved.longitude;
        resolvedCity = resolved.city;

        // Self-heal row in Supabase
        if (matchedAddress?.id) {
          supabase.from('customer_addresses').update({ latitude: lat, longitude: lon, city: resolvedCity }).eq('id', matchedAddress.id).catch?.(() => {});
        }
      }

      return {
        full_name: matchedAddress?.full_name || matchedProfile?.full_name || '',
        phone: matchedAddress?.phone || matchedProfile?.phone || `+91${cleanDigits}`,
        address_text: rawAddressText,
        city: resolvedCity,
        flat: matchedAddress?.flat || '',
        street: matchedAddress?.street || '',
        pincode: matchedAddress?.pincode || '',
        latitude: lat,
        longitude: lon
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching customer profile/address by phone from Supabase:', err);
    return null;
  }
}

// Save or update customer address and profile in Supabase
export async function saveCustomerPhoneAddress(param1, param2) {
  if (!isSupabaseConfigured) return null;

  let phone, fullName, flat, street, city, pincode, latitude, longitude, addressText, area, district, state, tag;

  if (typeof param1 === 'object' && param1 !== null) {
    ({ phone, fullName, flat, street, city, pincode, latitude, longitude, addressText, area, district, state, tag } = param1);
    if (!addressText && param1.name) addressText = param1.name;
    if (!addressText && param1.formattedAddress) addressText = param1.formattedAddress;
  } else if (typeof param1 === 'string') {
    phone = param1;
    if (typeof param2 === 'object' && param2 !== null) {
      ({ fullName, flat, street, city, pincode, latitude, longitude, addressText, area, district, state, tag } = param2);
      if (!addressText && param2.name) addressText = param2.name;
      if (!addressText && param2.formattedAddress) addressText = param2.formattedAddress;
    }
  }

  if (!phone) return null;

  try {
    const cleanDigits = get10DigitPhone(phone);
    if (!cleanDigits || cleanDigits.length < 10) return null;

    const normalized = `+91${cleanDigits}`;
    const nameVal = fullName ? fullName.trim() : 'Customer';

    // 1. Upsert profiles record
    await supabase.from('profiles').upsert({
      phone: normalized,
      role: 'customer',
      full_name: nameVal
    }, { onConflict: 'phone' });

    // 2. Check if customer_addresses record exists for this 10-digit phone
    const { data: existingAddrs } = await supabase.from('customer_addresses').select('*');
    const existing = (existingAddrs || []).find(a => get10DigitPhone(a.phone) === cleanDigits);

    const resolvedStreet = street || area || '';
    const rawAddress = addressText || `${flat ? flat + ', ' : ''}${resolvedStreet ? resolvedStreet + ', ' : ''}${city || ''}${pincode ? ' - ' + pincode : ''}`.trim();

    // Accurately resolve coordinates
    let finalLat = latitude != null ? parseFloat(latitude) : null;
    let finalLon = longitude != null ? parseFloat(longitude) : null;

    const coordResolved = resolveAddressCoordinates(rawAddress, resolvedStreet, city);

    // Validate that lat/lon match the locality
    const textLower = `${rawAddress} ${resolvedStreet} ${city || ''}`.toLowerCase();
    const isChik = textLower.includes('chikmagalur') || textLower.includes('chikkamagaluru') || textLower.includes('uppalli') || textLower.includes('577101');
    const isBlr = textLower.includes('bengaluru') || textLower.includes('bangalore') || textLower.includes('indiranagar') || textLower.includes('koramangala');

    if (finalLat == null || finalLon == null || (isChik && finalLat < 13.1) || (isBlr && finalLat > 13.1)) {
      finalLat = coordResolved.latitude;
      finalLon = coordResolved.longitude;
    }

    const resolvedCity = city || coordResolved.city || 'Chikkamagaluru';
    const resolvedPincode = pincode || (resolvedCity === 'Bengaluru' ? '560038' : '577101');
    const resolvedAddressText = rawAddress || `${flat ? flat + ', ' : ''}${resolvedStreet ? resolvedStreet + ', ' : ''}${resolvedCity}${resolvedPincode ? ' - ' + resolvedPincode : ''}`.trim();

    const payload = {
      phone: normalized,
      full_name: nameVal,
      flat: flat || '',
      street: resolvedStreet,
      city: resolvedCity,
      pincode: resolvedPincode,
      latitude: finalLat,
      longitude: finalLon,
      address_text: resolvedAddressText
    };

    if (existing?.id) {
      const { data, error } = await supabase
        .from('customer_addresses')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) console.error('Error updating customer_addresses in Supabase:', error);
      return data || payload;
    } else {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) console.error('Error inserting customer_addresses in Supabase:', error);
      return data || payload;
    }
  } catch (err) {
    console.error('Exception saving customer address in Supabase:', err);
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
