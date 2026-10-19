import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

/**
 * Countries for the phone code picker and "Where you live". Singapore and Malaysia come first:
 * that's where Airese launches. The rest is a short list of nearby and common countries.
 * Engineering: swap for the full ISO list (with localised names) when Airese opens elsewhere.
 */
export type Country = { code: CountryCode; name: string };

export const LAUNCH_COUNTRIES: Country[] = [
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
];

const OTHER_COUNTRIES: Country[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BN', name: 'Brunei' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'LA', name: 'Laos' },
  { code: 'MO', name: 'Macau' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
];

export const COUNTRIES: Country[] = [...LAUNCH_COUNTRIES, ...OTHER_COUNTRIES];

export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);

/** "SG" → 🇸🇬 (two regional-indicator letters). */
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));

/** "SG" → "+65" */
export const dialCode = (code: CountryCode) => `+${getCountryCallingCode(code)}`;

/** Malaysia's 13 states and 3 federal territories, A to Z. */
export const MY_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
];
