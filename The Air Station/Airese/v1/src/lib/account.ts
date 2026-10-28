import { useSyncExternalStore } from 'react';
import { resetNightNotes } from './nightNotes';
import { clearProfile, setProfile } from './profile';
import { restoreSampleRecordings } from './recordings';
import { recall, remember } from './session';

/**
 * The Airese account (management decision, Oct 2026): a verified email and a password make a user in
 * the database, with its own user ID. Then: log in, forgot password, log out, delete account.
 *
 *   create   Your details: email verified with a code (lib/emailCode.ts), a password, Continue
 *   log in   email and password (I already have an account, on the walkthrough; where the app opens once logged out)
 *   forgot   email → a 6-digit code (the same Verify your email sheet) → a new password → logged in
 *   log out  Profile. Recordings stay on the phone; logging in again brings everything back
 *   delete   Profile → Delete account: the account, details, recordings and notes, for good
 *
 * Prototype: nothing leaves the phone. Any valid email and a password of 8 or more characters logs in,
 * unless an account was made this session, then only its own password does.
 * Engineering: create the user server-side once the email is verified; store a hashed password; sessions
 * with a token in secure storage; rate-limit log in and codes; delete removes the user and every
 * server-side copy, then everything on the device.
 */
export const PASSWORD_MIN = 8;

type Account = { userId: string; email: string; password: string };
type State = { account: Account | null; signedIn: boolean };

let state: State = recall<State>('account', { account: null, signedIn: false });
const listeners = new Set<() => void>();
const save = (next: State) => {
  state = next;
  remember('account', state);
  listeners.forEach((l) => l());
};

/** Prototype: an ID like the database would give. */
const newUserId = () => `usr_${Math.random().toString(36).slice(2, 10)}`;

export const passwordProblem = (p: string) => (!p ? 'Create a password.' : p.length < PASSWORD_MIN ? `Use at least ${PASSWORD_MIN} characters.` : undefined);

/** End of Your details: the verified email and the password become an account, and you're in. */
export function createAccount(email: string, password: string) {
  save({ account: { userId: newUserId(), email, password }, signedIn: true });
}

/** Log in. Prototype: see above. Says what's wrong, plainly, or nothing when it worked. */
export async function logIn(email: string, password: string): Promise<string | undefined> {
  const known = state.account;
  if (known && known.email.toLowerCase() === email.toLowerCase() && known.password !== password) return 'That password isn’t right. Try again, or reset it.';
  if (password.length < PASSWORD_MIN) return 'That password isn’t right. Try again, or reset it.';
  save({ account: known && known.email.toLowerCase() === email.toLowerCase() ? known : { userId: newUserId(), email, password }, signedIn: true });
  setProfile({ email, verifiedEmail: email });
  return undefined;
}

/** Forgot password, last step: the code was right, so the new password is set and you're in. */
export function resetPassword(email: string, password: string) {
  const known = state.account?.email.toLowerCase() === email.toLowerCase() ? state.account : null;
  save({ account: { userId: known?.userId ?? newUserId(), email, password }, signedIn: true });
  setProfile({ email, verifiedEmail: email });
}

/** Log out: the account and what's on the phone stay; you log in again to get back in. */
export function logOut() {
  save({ ...state, signedIn: false });
}

/**
 * Profile → Delete account: the account, details, Sleep Diary and recordings, for good. The app starts
 * from the beginning. Prototype: the sample recordings come back so the next demo run has data.
 */
export function deleteAccount() {
  save({ account: null, signedIn: false });
  clearProfile();
  resetNightNotes();
  restoreSampleRecordings();
}

/**
 * Where the app opens after the splash: Home when logged in; Log in when there's an account but
 * you've logged out (you've seen the walkthrough); the walkthrough on a first run.
 */
export const startRoute = (): 'home' | 'login' | 'onboarding' => (state.signedIn ? 'home' : state.account ? 'login' : 'onboarding');

export function useAccount(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
