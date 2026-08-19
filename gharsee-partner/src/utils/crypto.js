// Lightweight client-side password hashing for legacy plain-text password
// columns (profiles.password, shops.password, rider_profiles.password).
//
// This is NOT a substitute for server-side bcrypt/argon2 — the database
// should hash with pgcrypto in a future migration. But it stops the
// immediate risk of storing raw passwords in Supabase tables that may be
// queryable through permissive RLS.
//
// We use a deterministic, salted SHA-256 (salt derived from a project
// constant). This means a leak of the table is no longer equivalent to
// leaking raw credentials, and the constant-time compare below resists
// trivial timing attacks even when an attacker can submit arbitrary
// (username, password) pairs.

const PROJECT_PEPPER = 'gharsee-mvp-pepper-v1';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(message) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder().encode(message);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return toHex(digest);
  }
  // Fallback: a tiny pure-JS SHA-256 is not bundled in this app, so refuse
  // to silently downgrade. Better to fail loudly than to store an
  // unhashed password.
  throw new Error('WebCrypto is unavailable; cannot hash password securely.');
}

// Hash a password for storage. The output is a hex string prefixed with the
// algorithm tag so that future migrations can detect legacy rows.
export async function hashPasswordForStorage(plain) {
  if (typeof plain !== 'string' || plain.length === 0) return null;
  const digest = await sha256Hex(`${PROJECT_PEPPER}:${plain}`);
  return `sha256$${digest}`;
}

export async function verifyPasswordAgainstStorage(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith('sha256$')) {
    const expected = await hashPasswordForStorage(plain);
    if (!expected) return false;
    return constantTimeStringEqual(expected, stored);
  }
  // Legacy plain-text row: only treat as match if the comparison succeeds
  // AND we have nothing to upgrade to yet. The caller decides whether to
  // re-hash on next successful login.
  return constantTimeStringEqual(String(plain), String(stored));
}

function constantTimeStringEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
