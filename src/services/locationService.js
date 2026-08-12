import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from './authService';

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
            reject({ code: 'PERMISSION_DENIED', message: 'Location permission is required to find stores near you.' });
            break;
          case error.POSITION_UNAVAILABLE:
            reject({ code: 'POSITION_UNAVAILABLE', message: 'Location services are currently unavailable.' });
            break;
          case error.TIMEOUT:
            reject({ code: 'TIMEOUT', message: 'Unable to detect your location. Please try again.' });
            break;
          default:
            reject({ code: 'UNKNOWN_ERROR', message: 'Unable to detect location. Please select your area manually.' });
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
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
      return {
        full_name: matchedAddress?.full_name || matchedProfile?.full_name || '',
        phone: matchedAddress?.phone || matchedProfile?.phone || `+91${cleanDigits}`,
        address_text: matchedAddress?.address_text || '',
        city: matchedAddress?.city || 'Chikkamagaluru',
        flat: matchedAddress?.flat || '',
        street: matchedAddress?.street || '',
        latitude: matchedAddress?.latitude ? parseFloat(matchedAddress.latitude) : 13.3161,
        longitude: matchedAddress?.longitude ? parseFloat(matchedAddress.longitude) : 75.7720
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching customer profile/address by phone from Supabase:', err);
    return null;
  }
}

// Save or update customer address and profile in Supabase
export async function saveCustomerPhoneAddress({ phone, fullName, flat, street, city = 'Chikkamagaluru', pincode, latitude, longitude, addressText }) {
  if (!isSupabaseConfigured || !phone) return null;

  try {
    const cleanDigits = get10DigitPhone(phone);
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

    const payload = {
      phone: normalized,
      full_name: nameVal,
      flat: flat || '',
      street: street || '',
      city: city || 'Chikkamagaluru',
      pincode: pincode || '',
      latitude: latitude || 13.3161,
      longitude: longitude || 75.7720,
      address_text: addressText || `${flat || ''} ${street || ''}, ${city}`.trim()
    };

    if (existing?.id) {
      const { data, error } = await supabase
        .from('customer_addresses')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) console.error('Error updating customer_addresses:', error);
      return data || payload;
    } else {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) console.error('Error inserting customer_addresses:', error);
      return data || payload;
    }
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
