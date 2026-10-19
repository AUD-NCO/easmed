/**
 * Email check, from the Verify button in the email field of Your details (onboarding, and Profile when
 * the email changes):
 *
 *   1. Verify → the server emails a 6-digit code (template: public/email-code.html).
 *   2. In their mail app the person taps the code (a link) or copies it.
 *   3. The link opens the Airese page in the phone's browser (public/verify-email.html, hosted at
 *      VERIFY_URL), with the code filled in. Verify there → "Email verified".
 *   4. The page opens the return link (airese://details?verified=1 in onboarding,
 *      airese://profile-details?verified=1 from Profile): back to Your details, which shows Verified.
 *      Continue (onboarding) or Save (Profile) is dimmed until then.
 *
 * Browser preview: steps 2 and 3 are drawn inside the phone (components/MailDemo, BrowserDemo) and
 * the page reports back with postMessage({ source: 'airese-verify', result: 'verified' }).
 *
 * Engineering: the server sends the email, keeps the code for 10 minutes, allows 5 tries and checks
 * it; on the way back the app asks the server rather than trusting ?verified=1.
 */

import { recall, remember } from './session';
import { setProfile } from './profile';

/** Prototype only: the code that works. */
export const DEMO_CODE = '482913';

/** Where the page will live. Its prototype copy is published next to the preview. */
export const VERIFY_DOMAIN = 'theairstation.com';
export const VERIFY_URL = `https://${VERIFY_DOMAIN}/airese/verify`;

/** Which Your details the page sends the person back to: onboarding's, or Profile's. */
export type CodeFrom = 'details' | 'profile-details';
export const returnLink = (from: CodeFrom) => `airese://${from}?verified=1`;

/** Step 1. Remembers which address the code went to. Prototype: nothing is sent. */
export async function sendCode(email: string): Promise<void> {
  remember('codeSentTo', email);
}

/** The address the last code went to (Profile reopens on it after the email link). */
export const codeSentTo = () => recall('codeSentTo', '');

/** Step 4: the code was right. That address is now the verified one (Profile.verifiedEmail). */
export const markVerified = () => setProfile({ verifiedEmail: codeSentTo() });

/** Browser preview: the page's prototype copy, with the email to show and the code already filled in. */
export const demoPageUrl = (email: string, from: CodeFrom) =>
  `verify-email.html?email=${encodeURIComponent(email)}&code=${DEMO_CODE}&redirect=${encodeURIComponent(returnLink(from))}`;
