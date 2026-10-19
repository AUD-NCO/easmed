/**
 * Prototype only: what the user has done this session (permissions, details, notes), kept until
 * the browser page is refreshed.
 *
 * On localhost the app runs inside the iPhone frame page (public/iphone.html), and the demo menu
 * reloads the app for each jump. So the state lives on the frame page (same origin), which only
 * resets on a real refresh. Elsewhere (device, shared preview) it's ordinary memory.
 * Engineering: replace with real on-device storage.
 */
type Bag = Record<string, unknown>;

function bag(): Bag {
  const g = globalThis as { __aireseSession?: Bag; parent?: { __aireseSession?: Bag } };
  try {
    if (g.parent && g.parent !== (globalThis as unknown)) {
      g.parent.__aireseSession ??= {};
      return g.parent.__aireseSession;
    }
  } catch {
    // A different origin: fall back to this page.
  }
  g.__aireseSession ??= {};
  return g.__aireseSession;
}

export function remember<T>(key: string, value: T) {
  bag()[key] = value;
}

export function recall<T>(key: string, fallback: T): T {
  const v = bag()[key];
  return v === undefined ? fallback : (v as T);
}
