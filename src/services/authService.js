import { supabase, isSupabaseConfigured, getSupabaseErrorMessage } from '../lib/supabase.js';

// Enable real authentication with Supabase Auth
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

// Normalize Indian mobile numbers to standard E.164 (+91XXXXXXXXXX)
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

// Deterministic synthetic email mapping for Supabase Auth Phone+Password UX
// Keeps 100% phone-based UX in frontend while utilizing Supabase Auth security
export function phoneToAuthEmail(phoneInput) {
  const clean = get10DigitPhone(phoneInput);
  if (!clean || clean.length < 10) return '';
  return `partner_${clean}@urgrozy.in`;
}

export function authEmailToPhone(emailInput) {
  if (!emailInput) return '';
  const match = emailInput.match(/partner_(\d{10})@/);
  if (match && match[1]) {
    return `+91${match[1]}`;
  }
  return '';
}

/**
 * Sign Up Partner with Phone + Password using Supabase Auth
 * Creates Supabase Auth user + public.profiles record
 */
export async function signUpPartnerWithPhone({
  phone,
  password,
  fullName,
  role = 'shopkeeper'
}) {
  if (!isSupabaseConfigured) {
    return { user: null, session: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, session: null, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!password || password.length < 6) {
    return { user: null, session: null, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const authEmail = phoneToAuthEmail(phone);
    const safeFullName = (fullName || (role === 'rider' ? 'Delivery Partner' : 'Store Partner')).trim();

    // 1. Create user in Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: authEmail,
      password: password,
      options: {
        data: {
          phone: normalizedPhone,
          full_name: safeFullName,
          role: role
        }
      }
    });

    if (authErr) {
      const msg = authErr.message || '';
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
        return {
          user: null,
          session: null,
          error: `An account with mobile number ${cleanDigits} already exists. Please Sign In.`
        };
      }
      return { user: null, session: null, error: getSupabaseErrorMessage(authErr) };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { user: null, session: null, error: 'Failed to create partner authentication account.' };
    }

    // 2. Safely create or update profile in public.profiles table
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          phone: normalizedPhone,
          full_name: safeFullName,
          role: role,
          updated_at: new Date().toISOString()
        });
    } catch (profileErr) {
      console.warn('Profile creation non-fatal warning:', profileErr);
    }

    return {
      user: {
        id: authUser.id,
        phone: normalizedPhone,
        email: authEmail,
        user_metadata: { full_name: safeFullName, role: role },
        role: role
      },
      session: authData.session,
      error: null
    };
  } catch (err) {
    console.error('Exception in signUpPartnerWithPhone:', err);
    return { user: null, session: null, error: err.message || 'Partner registration failed' };
  }
}

/**
 * Sign In Partner with Phone + Password using Supabase Auth
 * Includes safe legacy user auto-onboarding for existing database records
 */
export async function signInPartnerWithPhone({
  phone,
  password,
  expectedRole = 'shopkeeper'
}) {
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
    const authEmail = phoneToAuthEmail(phone);

    // 1. Attempt standard Supabase Auth Sign In
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password
    });

    // 2. If Sign In succeeded with Supabase Auth
    if (!authErr && authData?.user) {
      const authUser = authData.user;

      // Fetch or sync public.profiles record
      let userRole = authUser.user_metadata?.role || expectedRole;
      let userFullName = authUser.user_metadata?.full_name || (expectedRole === 'rider' ? 'Delivery Partner' : 'Store Partner');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        userRole = profile.role || userRole;
        userFullName = profile.full_name || userFullName;
      } else {
        // Create profile if missing
        await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            phone: normalizedPhone,
            role: userRole,
            full_name: userFullName
          })
          .catch?.(() => {});
      }

      // Role authorization check: ensure user is authorized for the target portal
      if (expectedRole && userRole && userRole !== expectedRole) {
        return {
          session: null,
          user: null,
          profile: null,
          error: `Access Restricted: This account is registered as a ${userRole === 'rider' ? 'Delivery Partner (Rider)' : 'Store Partner (Shopkeeper)'}. Please sign in to the ${userRole === 'rider' ? 'Rider Portal' : 'Store Partner Portal'}.`
        };
      }

      // Automatically link shopkeeper store owner_id or rider_profiles user_id if not yet linked
      if (expectedRole === 'shopkeeper') {
        const { data: shops } = await supabase.from('shops').select('id, owner_id, phone');
        const matchedShop = (shops || []).find(s => get10DigitPhone(s.phone) === cleanDigits);
        if (matchedShop && (!matchedShop.owner_id || matchedShop.owner_id !== authUser.id)) {
          await supabase.from('shops').update({ owner_id: authUser.id }).eq('id', matchedShop.id).catch?.(() => {});
        }
      } else if (expectedRole === 'rider') {
        const { data: riders } = await supabase.from('rider_profiles').select('id, user_id, phone');
        const matchedRider = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);
        if (matchedRider && (!matchedRider.user_id || matchedRider.user_id !== authUser.id)) {
          await supabase.from('rider_profiles').update({ user_id: authUser.id, is_online: true }).eq('id', matchedRider.id).catch?.(() => {});
        }
      }

      return {
        session: authData.session,
        user: {
          id: authUser.id,
          phone: normalizedPhone,
          email: authEmail,
          role: userRole,
          user_metadata: { full_name: userFullName, role: userRole }
        },
        profile: profile || { id: authUser.id, role: userRole, phone: normalizedPhone, full_name: userFullName },
        error: null
      };
    }

    // 3. If Sign In failed: Check for Legacy User Onboarding Migration
    // If the error was invalid credentials, check if an existing database record exists for this phone
    const authErrMsg = authErr?.message || '';
    if (authErrMsg.includes('Invalid login credentials') || authErrMsg.includes('invalid_credentials') || authErrMsg.includes('Email not confirmed')) {
      
      let matchedLegacy = null;
      let legacyName = expectedRole === 'rider' ? 'Delivery Partner' : 'Store Partner';

      if (expectedRole === 'shopkeeper') {
        const { data: shops } = await supabase.from('shops').select('*');
        matchedLegacy = (shops || []).find(s => get10DigitPhone(s.phone) === cleanDigits);
        if (matchedLegacy) {
          legacyName = matchedLegacy.name || matchedLegacy.owner_name || 'Store Partner';
        }
      } else if (expectedRole === 'rider') {
        const { data: riders } = await supabase.from('rider_profiles').select('*');
        matchedLegacy = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);
        if (matchedLegacy) {
          legacyName = matchedLegacy.full_name || matchedLegacy.name || 'Delivery Partner';
        }
      }

      // Check profiles table as well
      const { data: profiles } = await supabase.from('profiles').select('*');
      const matchedProfile = (profiles || []).find(p => get10DigitPhone(p.phone) === cleanDigits);

      if (matchedLegacy || matchedProfile) {
        // Provision new Supabase Auth account for this legacy record
        const { data: newAuthData, error: signUpErr } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              phone: normalizedPhone,
              full_name: legacyName,
              role: expectedRole
            }
          }
        });

        if (!signUpErr && newAuthData?.user) {
          const newUserId = newAuthData.user.id;

          // Upsert profiles row
          await supabase
            .from('profiles')
            .upsert({
              id: newUserId,
              phone: normalizedPhone,
              full_name: legacyName,
              role: expectedRole,
              updated_at: new Date().toISOString()
            })
            .catch?.(() => {});

          // Link shops or rider_profiles
          if (expectedRole === 'shopkeeper' && matchedLegacy?.id) {
            await supabase.from('shops').update({ owner_id: newUserId }).eq('id', matchedLegacy.id).catch?.(() => {});
          } else if (expectedRole === 'rider' && matchedLegacy?.id) {
            await supabase.from('rider_profiles').update({ user_id: newUserId, is_online: true }).eq('id', matchedLegacy.id).catch?.(() => {});
          }

          return {
            session: newAuthData.session,
            user: {
              id: newUserId,
              phone: normalizedPhone,
              email: authEmail,
              role: expectedRole,
              user_metadata: { full_name: legacyName, role: expectedRole }
            },
            profile: { id: newUserId, phone: normalizedPhone, role: expectedRole, full_name: legacyName },
            error: null
          };
        }
      }

      return {
        session: null,
        user: null,
        profile: null,
        error: 'Invalid mobile phone number or password. Please check your credentials.'
      };
    }

    return {
      session: null,
      user: null,
      profile: null,
      error: getSupabaseErrorMessage(authErr)
    };
  } catch (err) {
    console.error('Exception in signInPartnerWithPhone:', err);
    return { session: null, user: null, error: 'Authentication failed. Please check your mobile number and password.' };
  }
}

// Backward-compatibility aliases
export async function signUpUserWithPhone(params) {
  return signUpPartnerWithPhone({ ...params, role: params.role || 'shopkeeper' });
}

export async function signInUserWithPhone(params) {
  return signInPartnerWithPhone({ ...params, expectedRole: 'shopkeeper' });
}

export async function signUpUser(params) {
  return signUpPartnerWithPhone(params);
}

export async function signInUser(params) {
  return signInPartnerWithPhone(params);
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('signOut error:', err);
  }
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

    return profile || {
      id: user.id,
      phone: user.phone || user.user_metadata?.phone || authEmailToPhone(user.email) || '',
      role: user.user_metadata?.role || 'customer',
      full_name: user.user_metadata?.full_name || 'User'
    };
  } catch {
    return null;
  }
}