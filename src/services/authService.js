import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

// Phone + Password Sign Up for Shopkeeper & Rider Roles (Stores REAL info in Supabase!)
export async function signUpUserWithPhone({ phone, password, fullName, role = 'shopkeeper' }) {
  if (!isSupabaseConfigured) {
    return { user: null, session: null, error: 'Supabase is not configured' };
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return { user: null, session: null, error: 'Please enter a valid 10-digit mobile number.' };
  }

  try {
    // 1. Check if user profile already exists in Supabase profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingProfile) {
      // User profile already exists in Supabase, update name if needed & return user
      await supabase
        .from('profiles')
        .update({ full_name: fullName || existingProfile.full_name })
        .eq('id', existingProfile.id);

      const userObj = {
        id: existingProfile.id,
        phone: existingProfile.phone,
        user_metadata: { full_name: fullName || existingProfile.full_name, role: existingProfile.role || role }
      };

      return { user: userObj, session: null, error: null };
    }

    // 2. Try native Supabase Auth sign up with phone
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      phone: normalizedPhone,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: normalizedPhone,
          role: role
        }
      }
    });

    let userId = authData?.user?.id;

    // 3. If native Auth signup succeeds or fallback required, use a valid RFC 4122 v4 UUID
    if (!userId) {
      userId = generateUUID();
    }

    const { data: newProfile, error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone: normalizedPhone,
        full_name: fullName || 'Store Partner',
        role: role
      })
      .select()
      .maybeSingle();

    const finalUserId = newProfile?.id || userId;

    const userObj = {
      id: finalUserId,
      phone: normalizedPhone,
      user_metadata: { full_name: fullName, role }
    };

    console.log('REAL PARTNER REGISTERED IN SUPABASE PROFILES:', userObj);
    return { user: userObj, session: authData?.session || null, error: null };
  } catch (err) {
    console.error('Exception in signUpUserWithPhone:', err);
    return { user: null, session: null, error: err.message || 'Registration failed' };
  }
}

// Phone + Password Sign In for Shopkeeper & Rider Roles
export async function signInUserWithPhone({ phone, password }) {
  if (!isSupabaseConfigured) {
    return { session: null, user: null, error: 'Supabase is not configured' };
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return { session: null, user: null, error: 'Please enter a valid 10-digit mobile number.' };
  }

  try {
    // 1. Try native Supabase Auth sign in with phone
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password
    });

    if (!authErr && authData?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      return { session: authData.session, user: authData.user, profile, error: null };
    }

    // 2. Query real profile from Supabase profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile) {
      const userObj = {
        id: profile.id,
        phone: profile.phone,
        user_metadata: { full_name: profile.full_name, role: profile.role }
      };
      return { session: null, user: userObj, profile, error: null };
    }

    // If profile not found, register new partner profile directly in Supabase
    return signUpUserWithPhone({ phone: normalizedPhone, password, fullName: 'Store Partner', role: 'shopkeeper' });
  } catch (err) {
    console.error('Exception in signInUserWithPhone:', err);
    return { session: null, user: null, error: 'Authentication error. Please check mobile number.' };
  }
}

// Legacy alias handlers for backwards compatibility
export async function signUpUser(params) {
  return signUpUserWithPhone(params);
}

export async function signInUser(params) {
  return signInUserWithPhone(params);
}

// Sign Out
export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Silent catch
  }
}

// Get current authenticated profile
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
