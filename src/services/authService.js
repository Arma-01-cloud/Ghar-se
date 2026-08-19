import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashPasswordForStorage, verifyPasswordAgainstStorage } from '../utils/crypto';

// Enable real authentication with Supabase
export const ENABLE_REAL_AUTH = true;

// Standard RFC 4122 v4 UUID Generator
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to normalize Indian mobile numbers to standard E.164 (+91XXXXXXXXXX)
export function normalizePhone(phoneInput) {
  if (!phoneInput) return '';
  const digits = phoneInput.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phoneInput.startsWith('+')) return phoneInput;
  return `+${digits}`;
}

// Extract clean 10-digit number for matching regardless of country code or whitespace
export function get10DigitPhone(phoneInput) {
  if (!phoneInput) return '';
  return phoneInput.replace(/\D/g, '').slice(-10);
}

// Phone + Password Sign Up for Shopkeepers (Saves password in shops table WITHOUT owner_id)
export async function signUpUserWithPhone({ 
  phone, 
  password, 
  fullName, 
  storeName = 'My Grocery Store', 
  role = 'shopkeeper',
  address,
  locality,
  city,
  state,
  pincode,
  latitude,
  longitude,
  imageUrl
}) {
  if (!isSupabaseConfigured) {
    return { user: null, session: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, session: null, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!password || password.length < 4) {
    return { user: null, session: null, error: 'Password must be at least 4 characters long.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const hashed = await hashPasswordForStorage(password);

    // 1. Check if store with this 10-digit phone already exists in Supabase shops table
    const { data: allShops } = await supabase.from('shops').select('*');
    const existingShop = allShops?.find(s => get10DigitPhone(s.phone) === cleanDigits);

    if (existingShop) {
      return { user: null, session: null, error: `A store with phone number ${phone} is already registered in database. Please click Sign In.` };
    }

    // 2. Save profile in Supabase profiles table
    let userId = generateUUID();
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone: normalizedPhone,
        password: hashed,
        full_name: fullName || 'Store Partner',
        role: role
      });

    // 3. Create store in Supabase shops table (WITHOUT owner_id to prevent FK errors!)
    if (role === 'shopkeeper') {
      const shopLocality = locality || 'Uppalli';
      const shopCity = city || 'Chikkamagaluru';
      const shopState = state || 'Karnataka';
      const shopAddress = address || `${shopLocality}, ${shopCity}, ${shopState}${pincode ? ' - ' + pincode : ''}`;

      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([{
          name: storeName,
          phone: normalizedPhone,
          password: hashed,
          address: shopAddress,
          locality: shopLocality,
          city: shopCity,
          state: shopState,
          pincode: pincode || '',
          latitude: latitude != null ? parseFloat(latitude) : 12.9784,
          longitude: longitude != null ? parseFloat(longitude) : 77.6408,
          status: 'pending_approval',
          is_open: false,
          is_approved: false,
          image_url: imageUrl || '/images/store_lakshmi.jpg'
        }])
        .select()
        .single();

      if (shopErr) {
        console.error('Supabase shops table insert error:', shopErr);
      }
    }

    const userObj = {
      id: userId,
      phone: normalizedPhone,
      user_metadata: { full_name: fullName, role }
    };

    return { user: userObj, session: null, error: null };
  } catch (err) {
    console.error('Exception in signUpUserWithPhone:', err);
    return { user: null, session: null, error: err.message || 'Store registration failed' };
  }
}

// Phone + Password Sign In for Shopkeepers (VERIFIES DIRECTLY FROM SHOPS TABLE IN SUPABASE)
export async function signInUserWithPhone({ phone, password }) {
  if (!isSupabaseConfigured) {
    return { session: null, user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { session: null, user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password) {
    return { session: null, user: null, error: 'Please enter your password.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    // 1. Fetch all shops from Supabase shops table and match by 10-digit phone number
    const { data: shops, error: shopsErr } = await supabase.from('shops').select('*');

    if (shopsErr) {
      console.error('Error fetching shops from Supabase:', shopsErr);
    }

    const matchedShop = (shops || []).find(s => get10DigitPhone(s.phone) === cleanDigits);

    // 2. Fetch profiles table fallback
    const { data: profiles } = await supabase.from('profiles').select('*');
    const matchedProfile = (profiles || []).find(p => get10DigitPhone(p.phone) === cleanDigits);

    // CRITICAL CHECK 1: IF PERSON IS NOT IN SHOPS OR PROFILES TABLE -> DENY ACCESS!
    if (!matchedShop && !matchedProfile) {
      return { 
        session: null, 
        user: null, 
        profile: null, 
        error: `No store account found in database for mobile number ${phone}. Access denied. Please register your store under 'Register Your Store'.` 
      };
    }

    // CRITICAL CHECK 2: VERIFY PASSWORD DIRECTLY FROM SHOPS TABLE RECORD
    const dbPassword = matchedShop?.password || matchedProfile?.password;

    let passwordOk = false;
    if (dbPassword) {
      passwordOk = await verifyPasswordAgainstStorage(password, dbPassword);
    }

    if (dbPassword && !passwordOk) {
      return {
        session: null,
        user: null,
        profile: null,
        error: 'Incorrect password for this store. Phone number and password do not match our database records.'
      };
    }

    // If the matched row had NULL password, set one now (legacy row upgrade).
    // If the matched row had a plain-text password, upgrade it to a hash on
    // successful login (best-effort — failure is non-fatal).
    if (matchedShop && (!matchedShop.password || (dbPassword && !dbPassword.startsWith('sha256$')))) {
      try {
        const hashed = await hashPasswordForStorage(password);
        if (hashed) {
          await supabase
            .from('shops')
            .update({ password: hashed })
            .eq('id', matchedShop.id);
        }
      } catch {}
    }

    const userObj = {
      id: matchedShop?.id || matchedProfile?.id || generateUUID(),
      phone: matchedShop?.phone || normalizedPhone,
      user_metadata: { full_name: matchedShop?.name || matchedProfile?.full_name || 'Store Partner', role: 'shopkeeper' }
    };

    return { session: null, user: userObj, profile: matchedShop || matchedProfile, error: null };
  } catch (err) {
    console.error('Exception in signInUserWithPhone:', err);
    return { session: null, user: null, error: 'Authentication failed. Please check phone number and password.' };
  }
}

export async function signUpUser(params) {
  return signUpUserWithPhone(params);
}

export async function signInUser(params) {
  return signInUserWithPhone(params);
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch {}
}

export async function getCurrentUserProfile() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return profile || { id: user.id, phone: user.phone || '', role: user.user_metadata?.role || 'customer' };
  } catch {
    return null;
  }
}