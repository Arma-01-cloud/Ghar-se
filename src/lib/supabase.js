import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://tedpamqsxzdbafmmnvej.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZHBhbXFzeHpkYmFmbW1udmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQ1ODAsImV4cCI6MjEwMTc3MDU4MH0.BQmxRzqBOB4l0h-DjRzltKw-dH8Hw_0qQrN-2SwlUQM';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Centralized Helper to format PostgreSQL and Supabase errors into human-readable messages
export function getSupabaseErrorMessage(error) {
  if (!error) return 'An unknown error occurred.';
  const msg = typeof error === 'string' ? error : (error.message || error.details || JSON.stringify(error));

  if (msg.includes('duplicate key') || msg.includes('23505')) {
    return 'An account or store with these details already exists.';
  }
  if (msg.includes('foreign key') || msg.includes('23503')) {
    return 'Referenced record was not found in the database.';
  }
  if (msg.includes('RLS') || msg.includes('row-level security') || msg.includes('42501')) {
    return 'Database permission error. Row Level Security policy denied this request.';
  }
  if (msg.includes('invalid input syntax for type uuid') || msg.includes('22P02')) {
    return 'Invalid ID format in database request.';
  }
  if (msg.includes('not-null') || msg.includes('23502')) {
    return 'A required database field is missing.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Incorrect mobile number or password. Please try again.';
  }

  return msg;
}