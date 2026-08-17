import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePhone, get10DigitPhone, generateUUID } from './authService';
import { hashPasswordForStorage, verifyPasswordAgainstStorage } from '../utils/crypto';

// Update Rider is_online status in Supabase rider_profiles table
export async function updateRiderOnlineStatusInSupabase(riderPhone, isOnlineStatus) {
  if (!isSupabaseConfigured || !riderPhone) return false;

  try {
    const cleanDigits = get10DigitPhone(riderPhone);
    const { data: riders } = await supabase.from('rider_profiles').select('*');

    const matchedRider = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    if (matchedRider) {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ is_online: isOnlineStatus })
        .eq('id', matchedRider.id);

      return !error;
    } else {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ is_online: isOnlineStatus })
        .eq('phone', riderPhone);

      return !error;
    }
  } catch (err) {
    console.error('Error updating rider is_online status in Supabase:', err);
    return false;
  }
}

// Sign Up new Rider directly into Supabase rider_profiles table
export async function signUpRiderInSupabase({ phone, password, fullName, vehicleType = 'scooter', vehicleNumber = '', drivingLicense = '', deliveryCity = 'Chikkamagaluru' }) {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password || password.length < 4) {
    return { user: null, error: 'Password must be at least 4 characters long.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const hashed = await hashPasswordForStorage(password);

    // 1. Check if rider with this 10-digit phone already exists in Supabase rider_profiles table
    const { data: allRiders } = await supabase.from('rider_profiles').select('*');
    const existingRider = (allRiders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    if (existingRider) {
      return { user: null, error: `A delivery partner account with phone number ${phone} is already registered in database. Please click Sign In.` };
    }

    // 2. Full Payload WITHOUT user_id or owner_id to prevent Foreign Key constraints
    const payload = {
      full_name: fullName.trim(),
      phone: normalizedPhone,
      password: hashed,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      driving_license: drivingLicense.trim().toUpperCase(),
      delivery_city: deliveryCity,
      is_online: false
    };

    const { data: newRider, error: insertErr } = await supabase
      .from('rider_profiles')
      .insert([payload])
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('Supabase rider_profiles insert error:', insertErr.message);

      // Retry with minimal schema fallback if optional columns differ
      const minimalPayload = {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        password: hashed,
        is_online: false
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('rider_profiles')
        .insert([minimalPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        return { user: null, error: `Failed to register rider in Supabase: ${retryErr.message}` };
      }

      const riderUser = {
        id: retryData?.id,
        phone: normalizedPhone,
        fullName: fullName.trim(),
        name: fullName.trim(),
        role: 'rider',
        isOnline: false,
        isPending: true,
        isApproved: false,
        status: 'pending_approval'
      };
      return { user: riderUser, error: null };
    }

    const riderUser = {
      id: newRider?.id,
      phone: normalizedPhone,
      fullName: fullName.trim(),
      name: fullName.trim(),
      role: 'rider',
      isOnline: false,
      isPending: true,
      isApproved: false,
      status: 'pending_approval'
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signUpRiderInSupabase:', err);
    return { user: null, error: err.message || 'Rider registration failed' };
  }
}

// Sign In Rider directly from Supabase rider_profiles table
export async function signInRiderWithPhone({ phone, password }) {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password) {
    return { user: null, error: 'Please enter your password.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    // 1. Fetch all riders from Supabase rider_profiles table and match by 10-digit phone number
    const { data: riders, error: ridersErr } = await supabase.from('rider_profiles').select('*');

    if (ridersErr) {
      console.error('Error fetching rider_profiles from Supabase:', ridersErr);
    }

    const matchedRider = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    // CRITICAL CHECK 1: IF RIDER IS NOT IN rider_profiles TABLE -> DENY ACCESS!
    if (!matchedRider) {
      return {
        user: null,
        error: `No delivery partner account found in database for mobile number ${phone}. Access denied. Please register as a new rider.`
      };
    }

    // CRITICAL CHECK 2: VERIFY PASSWORD DIRECTLY FROM rider_profiles RECORD
    if (matchedRider.password) {
      const ok = await verifyPasswordAgainstStorage(password, matchedRider.password);
      if (!ok) {
        return {
          user: null,
          error: 'Incorrect password for this rider account. Phone number and password do not match our database records.'
        };
      }
    }

    // Set rider is_online = true in Supabase upon successful sign-in.
    // If the stored password was a legacy plain-text value, upgrade it to a
    // hash on the way through (best-effort).
    try {
      const isLegacy = !matchedRider.password || !String(matchedRider.password).startsWith('sha256$');
      const update = { is_online: true };
      if (isLegacy) {
        const hashed = await hashPasswordForStorage(password);
        if (hashed) update.password = hashed;
      }
      await supabase
        .from('rider_profiles')
        .update(update)
        .eq('id', matchedRider.id);
    } catch {}

    const riderUser = {
      id: matchedRider.id || generateUUID(),
      phone: matchedRider.phone || normalizedPhone,
      user_metadata: { full_name: matchedRider.full_name || 'Delivery Partner', role: 'rider' },
      ...matchedRider,
      is_online: true
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signInRiderWithPhone:', err);
    return { user: null, error: 'Authentication failed. Please check phone number and password.' };
  }
}
