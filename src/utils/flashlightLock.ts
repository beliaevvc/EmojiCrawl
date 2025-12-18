// Global lock for the Lumos/Nox flashlight easter egg.
// Used to disable the flashlight while UI effects (e.g. curse "Тьма") are active.

const LOCK_KEY = '__SKAZMOR_FLASHLIGHT_LOCK__';

export function isFlashlightLocked(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any)[LOCK_KEY]);
}

export function setFlashlightLocked(locked: boolean) {
  if (typeof window === 'undefined') return;
  (window as any)[LOCK_KEY] = locked;
  window.dispatchEvent(new CustomEvent('flashlight-lock-changed', { detail: locked }));
}


