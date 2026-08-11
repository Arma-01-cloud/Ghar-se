import { mockPartnerSignUp, mockPartnerSignIn } from './mock/partnerService';

export function normalizePhone(phoneInput) {
  if (!phoneInput) return '';
  const digits = phoneInput.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phoneInput.startsWith('+')) return phoneInput;
  return `+${digits}`;
}

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

export async function signUpUserWithPhone(params) {
  return await mockPartnerSignUp(params);
}

export async function signInUserWithPhone(params) {
  return await mockPartnerSignIn(params);
}

export async function signOutUser() {
  return true;
}

export async function getCurrentUserProfile() {
  return null;
}
