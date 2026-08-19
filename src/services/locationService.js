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

// Helper for fast IP-based coordinate fallback when GPS sensors are delayed or indoors
async function getIpOrFallbackCoordinates() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.latitude != null && data.longitude != null) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 500
        };
      }
    }
  } catch {
    // Fallthrough to default
  }

  return {
    latitude: 13.3284,
    longitude: 75.7578,
    accuracy: 100
  };
}

// Browser Geolocation API wrapper with Progressive Multi-tier Fallback & Error handling
export async function getCurrentPositionCoordinates() {
  if (!navigator.geolocation) {
    return await getIpOrFallbackCoordinates();
  }

  // 1. Try Browser Geolocation with High Accuracy (fast 5-second attempt)
  try {
    const highAccPosition = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    });
    return highAccPosition;
  } catch (highAccError) {
    // If user explicitly denied permission, throw clear error
    if (highAccError?.code === 1) {
      throw { code: 'PERMISSION_DENIED', message: 'Location permission was denied. Please select your area manually below or enable permission in browser settings.' };
    }
    // For TIMEOUT (code 3) or POSITION_UNAVAILABLE (code 2), smoothly attempt network/cell-tower location
  }

  // 2. Try Browser Geolocation with Standard Accuracy (Faster, works indoors & on mobile network)
  try {
    const stdPosition = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        (err) => reject(err),
        {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 300000 // Accept 5-minute cached network location
        }
      );
    });
    return stdPosition;
  } catch (stdError) {
    if (stdError?.code === 1) {
      throw { code: 'PERMISSION_DENIED', message: 'Location permission was denied. Please select your area manually below or enable permission in browser settings.' };
    }
  }

  // 3. Fallback to IP Geolocation if GPS hardware is not responding / timed out
  try {
    const ipCoords = await getIpOrFallbackCoordinates();
    return ipCoords;
  } catch {
    // 4. Default to Chikkamagaluru (Uppalli)
    return {
      latitude: 13.3284,
      longitude: 75.7578,
      accuracy: 100
    };
  }
}

// Comprehensive Reference Localities table for instant offline fallback (Chikkamagaluru focused)
export const KNOWN_LOCALITY_LOOKUP = [
  { name: 'Uppalli, Chikkamagaluru', area: 'Uppalli', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3284, lon: 75.7578 },
  { name: 'Vijayapura, Chikkamagaluru', area: 'Vijayapura', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3210, lon: 75.7820 },
  { name: 'Market Road, Chikkamagaluru', area: 'Market Road / IG Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3161, lon: 75.7720 },
  { name: 'MG Road, Chikkamagaluru', area: 'MG Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3175, lon: 75.7725 },
  { name: 'Rathnagiri Road, Chikkamagaluru', area: 'Rathnagiri Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3245, lon: 75.7780 },
  { name: 'KM Road, Chikkamagaluru', area: 'KM Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3280, lon: 75.7650 },
  { name: 'Basavanahalli, Chikkamagaluru', area: 'Basavanahalli', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3180, lon: 75.7760 },
  { name: 'Shankarpura, Chikkamagaluru', area: 'Shankarpura', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3140, lon: 75.7680 },
  { name: 'Kalyan Nagar, Chikkamagaluru', area: 'Kalyan Nagar', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3315, lon: 75.7830 },
  { name: 'Housing Board Colony, Chikkamagaluru', area: 'Housing Board Colony', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3340, lon: 75.7710 },
  { name: 'Jyothi Nagar, Chikkamagaluru', area: 'Jyothi Nagar', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3320, lon: 75.7610 },
  { name: 'Dantaramakki, Chikkamagaluru', area: 'Dantaramakki', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3260, lon: 75.7920 },
  { name: 'Ramanahalli, Chikkamagaluru', area: 'Ramanahalli', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3080, lon: 75.7850 },
  { name: 'Bus Stand Road, Chikkamagaluru', area: 'Bus Stand Road', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3195, lon: 75.7745 },
  { name: 'Naidu Street, Chikkamagaluru', area: 'Naidu Street', district: 'Chikkamagaluru', city: 'Chikkamagaluru', state: 'Karnataka', pincode: '577101', lat: 13.3170, lon: 75.7740 }
];

function getNearestKnownLocality(lat, lon) {
  let best = KNOWN_LOCALITY_LOOKUP[0];
  let minDistance = calculateHaversineDistance(lat, lon, best.lat, best.lon);

  for (let i = 1; i < KNOWN_LOCALITY_LOOKUP.length; i++) {
    const loc = KNOWN_LOCALITY_LOOKUP[i];
    const dist = calculateHaversineDistance(lat, lon, loc.lat, loc.lon);
    if (dist != null && (minDistance == null || dist < minDistance)) {
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
    latitude: lat || best.lat,
    longitude: lon || best.lon
  };
}

// Convert GPS coordinates into human-readable Area, District, State, Pincode
export async function reverseGeocodeCoordinates(lat, lon) {
  if (lat == null || lon == null) {
    return KNOWN_LOCALITY_LOOKUP[0];
  }

  // If coordinates are within Chikkamagaluru region (~15km radius), snap to nearest known Chikkamagaluru area
  const dToChik = calculateHaversineDistance(lat, lon, 13.3161, 75.7720);
  if (dToChik != null && dToChik < 15) {
    return getNearestKnownLocality(lat, lon);
  }

  // 1. Try BigDataCloud Reverse Geocoding Client API (Fast, Free, CORS enabled)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const area = data.locality || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name || data.city || 'Uppalli';
      const district = data.localityInfo?.administrative?.[2]?.name || data.principalSubdivision || data.city || 'Chikkamagaluru';
      const city = data.city || data.locality || district || 'Chikkamagaluru';
      const state = data.principalSubdivision || 'Karnataka';
      const pincode = data.postcode || '577101';

      const cleanArea = area.replace(/District|Taluk/gi, '').trim();
      const cleanCity = city.replace(/District|Taluk/gi, '').trim();
      const cleanDistrict = district.replace(/Taluk/gi, '').trim();

      const shortTitle = cleanArea && cleanArea !== cleanCity ? `${cleanArea}, ${cleanCity}` : `${cleanCity}, ${state}`;
      const fullAddr = `${cleanArea ? cleanArea + ', ' : ''}${cleanCity}, ${cleanDistrict && cleanDistrict !== cleanCity ? cleanDistrict + ', ' : ''}${state} - ${pincode}`.trim();

      return {
        name: shortTitle,
        area: cleanArea || cleanCity || 'Uppalli',
        district: cleanDistrict || cleanCity || 'Chikkamagaluru',
        city: cleanCity || 'Chikkamagaluru',
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
    const timeoutId = setTimeout(() => controller.abort(), 3500);
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
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.town || addr.hamlet || 'Uppalli';
      const district = addr.state_district || addr.county || addr.city_district || addr.city || 'Chikkamagaluru';
      const city = addr.city || addr.town || addr.municipality || district || 'Chikkamagaluru';
      const state = addr.state || 'Karnataka';
      const pincode = addr.postcode || '577101';

      const shortName = area ? `${area}, ${city}` : (data.name || `${city}, ${state}`);
      const fullAddr = [addr.road, area, city, district, state, pincode].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

      return {
        name: shortName,
        area: area || city || 'Uppalli',
        district: district || city || 'Chikkamagaluru',
        city: city || 'Chikkamagaluru',
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Chikkamagaluru, Karnataka, India')}&addressdetails=1&limit=6&countrycodes=in`,
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
          const city = addr.city || addr.town || addr.municipality || addr.state_district || 'Chikkamagaluru';
          const state = addr.state || 'Karnataka';
          const district = addr.state_district || addr.county || 'Chikkamagaluru';
          const pincode = addr.postcode || '577101';

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
  if (combined.includes('vijayapura') || combined.includes('vijaypur')) {
    return { latitude: 13.3210, longitude: 75.7820, city: 'Chikkamagaluru', area: 'Vijayapura' };
  }
  if (combined.includes('rathnagiri')) {
    return { latitude: 13.3245, longitude: 75.7780, city: 'Chikkamagaluru', area: 'Rathnagiri Road' };
  }
  if (combined.includes('market road') || combined.includes('ig road')) {
    return { latitude: 13.3161, longitude: 75.7720, city: 'Chikkamagaluru', area: 'Market Road' };
  }
  if (combined.includes('mg road')) {
    return { latitude: 13.3175, longitude: 75.7725, city: 'Chikkamagaluru', area: 'MG Road' };
  }
  if (combined.includes('km road')) {
    return { latitude: 13.3280, longitude: 75.7650, city: 'Chikkamagaluru', area: 'KM Road' };
  }
  if (combined.includes('basavanahalli')) {
    return { latitude: 13.3180, longitude: 75.7760, city: 'Chikkamagaluru', area: 'Basavanahalli' };
  }
  if (combined.includes('shankarpura')) {
    return { latitude: 13.3140, longitude: 75.7680, city: 'Chikkamagaluru', area: 'Shankarpura' };
  }
  if (combined.includes('kalyan nagar')) {
    return { latitude: 13.3315, longitude: 75.7830, city: 'Chikkamagaluru', area: 'Kalyan Nagar' };
  }
  if (combined.includes('housing board') || combined.includes('khb')) {
    return { latitude: 13.3340, longitude: 75.7710, city: 'Chikkamagaluru', area: 'Housing Board Colony' };
  }
  if (combined.includes('jyothi nagar')) {
    return { latitude: 13.3320, longitude: 75.7610, city: 'Chikkamagaluru', area: 'Jyothi Nagar' };
  }
  if (combined.includes('dantaramakki')) {
    return { latitude: 13.3260, longitude: 75.7920, city: 'Chikkamagaluru', area: 'Dantaramakki' };
  }
  if (combined.includes('ramanahalli')) {
    return { latitude: 13.3080, longitude: 75.7850, city: 'Chikkamagaluru', area: 'Ramanahalli' };
  }
  if (combined.includes('bus stand')) {
    return { latitude: 13.3195, longitude: 75.7745, city: 'Chikkamagaluru', area: 'Bus Stand Road' };
  }
  if (combined.includes('naidu street')) {
    return { latitude: 13.3170, longitude: 75.7740, city: 'Chikkamagaluru', area: 'Naidu Street' };
  }
  if (combined.includes('chikmagalur') || combined.includes('chikkamagaluru') || combined.includes('chikkamanglur') || combined.includes('577101')) {
    return { latitude: 13.3161, longitude: 75.7720, city: 'Chikkamagaluru', area: 'Chikkamagaluru' };
  }

  // Fallback to reference lookup table
  for (const loc of KNOWN_LOCALITY_LOOKUP) {
    if (combined.includes(loc.area.toLowerCase()) || combined.includes(loc.name.toLowerCase())) {
      return { latitude: loc.lat, longitude: loc.lon, city: loc.city, area: loc.area };
    }
  }

  return { latitude: 13.3284, longitude: 75.7578, city: 'Chikkamagaluru', area: 'Uppalli' };
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
