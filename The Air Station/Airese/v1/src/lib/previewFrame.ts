/**
 * Browser preview only: the iPhone frame (public/iphone.html) draws the status bar and home
 * indicator in white, as the app is dark throughout. Screens that stand in for other apps on a
 * light background (MailDemo, BrowserDemo) switch them to dark while they're showing.
 */
export function setFrameBars(tone: 'light' | 'dark') {
  const send = (w: Window) => w.dispatchEvent(new CustomEvent('airese:bars', { detail: tone }));
  send(window);
  try {
    if (window.parent !== window) send(window.parent); // localhost: the app runs in the frame's iframe
  } catch {
    // A different origin: no frame to tell.
  }
}
