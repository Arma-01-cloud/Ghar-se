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
