/**
 * Email check, from the Verify button in the email field of Create account (sign-up), and of Profile's Your details when
 * the email changes:
 *
 *   1. Verify → the server emails a 6-digit code (template: public/email-code.html), and the
 *      Verify your email sheet opens (components/EmailCodeSheet): where the code went, how long it works.
 *   2. In their mail app the person taps Copy OTP: the code is copied and the app opens again
 *      (the button's link, {{app_link}} in the template), still on the sheet.
 *   3. Paste code. The right code → "Email verified", the sheet closes by itself and the email field
 *      shows Verified. Continue (Create account) or Save (Profile) is dimmed until then.
 *
 * Prototype: step 2 is drawn inside the phone (components/MailDemo), from "Demo: open the email" on the sheet.
 *
 * Engineering: the server sends the email, keeps the code for 10 minutes, allows 5 tries and checks
 * it. A plain email can't copy to the clipboard by itself, so in the real app the link also carries
 * the code and the app fills it in.
 */

import { setProfile } from './profile';

/** Prototype only: the code that works. */
export const DEMO_CODE = '482913';

/** How long a code works. */
export const CODE_MINUTES = 10;

/** Step 1. Prototype: nothing is sent. */
export async function sendCode(_email: string): Promise<void> {}

/** Step 3. Prototype: only DEMO_CODE works. */
export const checkCode = async (code: string): Promise<boolean> => code === DEMO_CODE;

/** Step 3: the code was right. That address is now the verified one (Profile.verifiedEmail). */
export const markVerified = (email: string) => setProfile({ verifiedEmail: email });
