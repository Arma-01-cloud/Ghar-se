import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizePhone, get10DigitPhone, generateUUID, signUpPartnerWithPhone, signInPartnerWithPhone } from './authService.js';

// Update Rider is_online status in Supabase rider_profiles table
export async function updateRiderOnlineStatusInSupabase(riderPhone, isOnlineStatus, userId = null) {
  if (!isSupabaseConfigured) return false;

  try {
    if (userId) {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ is_online: isOnlineStatus })
        .eq('user_id', userId);

      if (!error) return true;
    }

    if (riderPhone) {
      const cleanDigits = get10DigitPhone(riderPhone);
      const { data: riders } = await supabase.from('rider_profiles').select('id, phone');
      const matched = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

      if (matched) {
        const { error } = await supabase
          .from('rider_profiles')
          .update({ is_online: isOnlineStatus })
          .eq('id', matched.id);

        return !error;
      }
    }

    return false;
  } catch (err) {
    console.error('Error updating rider is_online status in Supabase:', err);
    return false;
  }
}

// Sign Up new Rider using Supabase Auth + rider_profiles record
export async function signUpRiderInSupabase({
  phone,
  password,
  fullName,
  vehicleType = 'scooter',
  vehicleNumber = '',
  drivingLicense = '',
  deliveryCity = 'Chikkamagaluru'
}) {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password || password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const safeFullName = (fullName || 'Delivery Partner').trim();

    // 1. Create Supabase Auth User with role 'rider'
    const authRes = await signUpPartnerWithPhone({
      phone: normalizedPhone,
      password,
      fullName: safeFullName,
      role: 'rider'
    });

    if (authRes.error || !authRes.user) {
      return { user: null, error: authRes.error || 'Rider authentication registration failed.' };
    }

    const authUser = authRes.user;

    // 2. Check if rider profile row with this phone already exists in rider_profiles
    const { data: allRiders } = await supabase.from('rider_profiles').select('*');
    const existingRider = (allRiders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    const riderPayload = {
      user_id: authUser.id,
      full_name: safeFullName,
      phone: normalizedPhone,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      driving_license: drivingLicense.trim().toUpperCase(),
      delivery_city: deliveryCity,
      is_online: false,
      is_approved: true,
      status: 'active'
    };

    if (existingRider) {
      // Update existing record with user_id
      await supabase
        .from('rider_profiles')
        .update(riderPayload)
        .eq('id', existingRider.id);

      const riderUser = {
        id: existingRider.id,
        user_id: authUser.id,
        phone: normalizedPhone,
        fullName: safeFullName,
        name: safeFullName,
        role: 'rider',
        isOnline: false,
        isPending: false,
        isApproved: true,
        status: 'active',
        ...riderPayload
      };
      return { user: riderUser, error: null };
    }

    // Insert new rider profile
    const { data: newRider, error: insertErr } = await supabase
      .from('rider_profiles')
      .insert([riderPayload])
      .select()
      .maybeSingle();

    if (insertErr) {
      console.warn('Full rider payload insert failed, retrying minimal payload:', insertErr.message);

      const minimalPayload = {
        user_id: authUser.id,
        full_name: safeFullName,
        phone: normalizedPhone,
        is_online: false
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('rider_profiles')
        .insert([minimalPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        console.error('Minimal rider insert failed:', retryErr);
      }

      const riderUser = {
        id: retryData?.id || authUser.id,
        user_id: authUser.id,
        phone: normalizedPhone,
        fullName: safeFullName,
        name: safeFullName,
        role: 'rider',
        isOnline: false,
        isPending: false,
        isApproved: true,
        status: 'active'
      };
      return { user: riderUser, error: null };
    }

    const riderUser = {
      id: newRider?.id || authUser.id,
      user_id: authUser.id,
      phone: normalizedPhone,
      fullName: safeFullName,
      name: safeFullName,
      role: 'rider',
      isOnline: false,
      isPending: false,
      isApproved: true,
      status: 'active',
      ...newRider
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signUpRiderInSupabase:', err);
    return { user: null, error: err.message || 'Rider registration failed' };
  }
}

// Sign In Rider using Supabase Auth
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
    const authRes = await signInPartnerWithPhone({
      phone,
      password,
      expectedRole: 'rider'
    });

    if (authRes.error || !authRes.user) {
      return { user: null, error: authRes.error || 'Authentication failed. Please check phone number and password.' };
    }

    const authUser = authRes.user;

    // Fetch live rider profile
    const { data: riders } = await supabase.from('rider_profiles').select('*');
    let matchedRider = (riders || []).find(r => (authUser.id && r.user_id === authUser.id) || (get10DigitPhone(r.phone) === cleanDigits));

    if (matchedRider) {
      // Ensure user_id and online status are synced
      await supabase
        .from('rider_profiles')
        .update({ user_id: authUser.id, is_online: true })
        .eq('id', matchedRider.id)
        .catch?.(() => {});
    }

    const riderUser = {
      id: matchedRider?.id || authUser.id,
      user_id: authUser.id,
      phone: authUser.phone || matchedRider?.phone,
      fullName: matchedRider?.full_name || authUser.user_metadata?.full_name || 'Delivery Partner',
      name: matchedRider?.full_name || authUser.user_metadata?.full_name || 'Delivery Partner',
      role: 'rider',
      is_online: true,
      isOnline: true,
      ...matchedRider
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signInRiderWithPhone:', err);
    return { user: null, error: 'Authentication failed. Please check phone number and password.' };
  }
}