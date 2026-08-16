import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tedpamqsxzdbafmmnvej.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZHBhbXFzeHpkYmFmbW1udmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQ1ODAsImV4cCI6MjEwMTc3MDU4MH0.BQmxRzqBOB4l0h-DjRzltKw-dH8Hw_0qQrN-2SwlUQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;

export const getSupabaseErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return JSON.stringify(error);
};
