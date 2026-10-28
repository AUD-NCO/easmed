import { useSyncExternalStore } from 'react';
import { AsYouType, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { recall, remember } from './session';

/**
 * The user's details, asked for in onboarding and editable in Profile. In onboarding everything is
 * required: name, phone and a verified email (Your details), then About you. They help the sleep care
 * team (and a doctor reading the report).
 * Kept in memory for the prototype.
 * Engineering: persist on device (e.g. expo-secure-store / SQLite) in line with "data stays on your phone".
 */
export type Gender = 'male' | 'female' | 'transgender' | 'unsaid';
export type Units = 'metric' | 'imperial';

export type Profile = {
  firstName: string;
  lastName: string;
  phoneCountry: CountryCode; // the country code chip, e.g. 'SG'
  phone: string; // national number, digits only; see phoneE164()
  email: string;
  verifiedEmail: string; // the address last confirmed with the 6-digit code (lib/emailCode.ts); verified when it equals `email`
  gender: Gender | '';
  birthYear: string; // stored instead of age, which goes out of date; the UI shows the age
  heightCm: string; // always stored metric; `units` only changes how it's shown
  weightKg: string;
  units: Units;
  city: string;
  region: string; // state, county or province
  country: string; // country name, e.g. 'Singapore'
  postcode: string; // Malaysia: the 5-digit postcode (V1 asks only this, in place of state and town)
};

const EMPTY: Profile = {
  firstName: '',
  lastName: '',
  phoneCountry: 'SG',
  phone: '',
  email: '',
  verifiedEmail: '',
  gender: '',
  birthYear: '',
  heightCm: '',
  weightKg: '',
  units: 'metric',
  city: '',
  region: '',
  country: '',
  postcode: '',
};

let profile: Profile = { ...EMPTY, ...recall<Partial<Profile>>('profile', {}) };
const listeners = new Set<() => void>();

export function setProfile(next: Partial<Profile>) {
  profile = { ...profile, ...next };
  remember('profile', profile);
  listeners.forEach((l) => l());
}

/**
 * Prototype only: onboarding can't be skipped, so a real profile is always complete. Opening Profile
 * from the demo nav without going through onboarding fills in this sample person (email verified).
 */
const SAMPLE: Profile = {
  ...EMPTY,
  firstName: 'Alex',
  lastName: 'Tan',
  phone: '91234567',
  email: 'alex.tan@example.com',
  verifiedEmail: 'alex.tan@example.com',
  gender: 'male',
  birthYear: '1984',
  heightCm: '175',
  weightKg: '78',
  country: 'Singapore',
};
export function ensureSampleProfile() {
  if (!profile.email) setProfile(SAMPLE);
}

/** Delete account: back to an empty profile. */
export const clearProfile = () => setProfile(EMPTY);

export function useProfile(): Profile {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => profile,
  );
}

/** "Kedar Nimkar" → "KN". Empty when no name was given. */
export function initials({ firstName, lastName }: Profile) {
  return `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();
}

/** Four digits, from 1900 to this year. */
export function isValidYear(year: string) {
  const y = Number(year);
  return year.length === 4 && y >= 1900 && y <= new Date().getFullYear();
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/** A real number for that country (right length and leading digits). */
export const isValidPhone = (digits: string, country: CountryCode) => isValidPhoneNumber(digits, country);

/** Digits as the user types them → "9123 4567" (SG), "12-345 6789" (MY). */
export const formatPhone = (digits: string, country: CountryCode) => (digits ? new AsYouType(country).input(digits) : '');

/** "+6591234567": what the care team dials. Empty when there's no valid number. */
export function phoneE164({ phone, phoneCountry }: Pick<Profile, 'phone' | 'phoneCountry'>) {
  return parsePhoneNumberFromString(phone, phoneCountry)?.number ?? '';
}

/** "+65 9123 4567", for showing the number back. */
export function phoneDisplay({ phone, phoneCountry }: Pick<Profile, 'phone' | 'phoneCountry'>) {
  return parsePhoneNumberFromString(phone, phoneCountry)?.formatInternational() ?? phone;
}

// ---------- Age, height and weight ----------

export const ageFrom = (birthYear: string) => (isValidYear(birthYear) ? new Date().getFullYear() - Number(birthYear) : undefined);

export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

/** 172 → "5′ 8″" */
export function feetInches(cm: number) {
  const inches = Math.round(cm / CM_PER_IN);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}

/** "172" → "172 cm" or "5′ 8″". Empty when not set. */
export function heightLabel(heightCm: string, units: Units) {
  if (!heightCm) return '';
  return units === 'metric' ? `${Math.round(Number(heightCm))} cm` : feetInches(Number(heightCm));
}

/** "78" → "78 kg" or "172 lb". Empty when not set. */
export function weightLabel(weightKg: string, units: Units) {
  if (!weightKg) return '';
  return units === 'metric' ? `${Math.round(Number(weightKg))} kg` : `${Math.round(Number(weightKg) / KG_PER_LB)} lb`;
}

export const GENDER_LABEL: Record<Gender, string> = { male: 'Male', female: 'Female', transgender: 'Transgender', unsaid: 'Prefer not to say' };

/** "Singapore", "Malaysia 47400", "Leeds, United Kingdom". Empty when not set. */
export function placeLabel({ city, region, country, postcode }: Pick<Profile, 'city' | 'region' | 'country' | 'postcode'>) {
  if (country === 'Singapore') return 'Singapore';
  if (country === 'Malaysia') return postcode ? `Malaysia ${postcode}` : [city, region].filter(Boolean).join(', ') || 'Malaysia';
  return [city, region, country].filter(Boolean).join(', ');
}

// ---------- Notification preferences ----------

/**
 * The one notification Airese sends: a bedtime reminder to record (Profile → Settings). Needs the
 * system permission on. Engineering: schedule it (expo-notifications); the time is still to be decided.
 */
export type NotificationPrefs = { bedtime: boolean };
let prefs: NotificationPrefs = recall('notificationPrefs', { bedtime: false });
const prefListeners = new Set<() => void>();

export function setNotificationPref(key: keyof NotificationPrefs, on: boolean) {
  prefs = { ...prefs, [key]: on };
  remember('notificationPrefs', prefs);
  prefListeners.forEach((l) => l());
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(
    (l) => {
      prefListeners.add(l);
      return () => prefListeners.delete(l);
    },
    () => prefs,
  );
}
