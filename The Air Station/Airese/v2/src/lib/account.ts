import { resetNightNotes } from './nightNotes';
import { clearProfile } from './profile';
import { restoreSampleRecordings } from './recordings';

/**
 * Profile → Erase everything and start again. There are no accounts yet, so this is everything
 * Airese keeps on the phone: details, Night Notes and recordings. The app then starts from the
 * beginning. Prototype: the sample recordings come back so the next demo run has data.
 * Engineering: delete everything Airese stored on the device (audio, analysis, details,
 * preferences), and any server-side copy once accounts exist.
 */
export function eraseEverything() {
  clearProfile();
  resetNightNotes();
  restoreSampleRecordings();
}
