import { useSyncExternalStore } from 'react';

const KEY = 'partner-demo-activated';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function notify() {
  listeners.forEach((cb) => cb());
}

function getSnapshot() {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

export function useDemoActivation() {
  const isActivated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    isActivated,
    activate: () => {
      try { localStorage.setItem(KEY, 'true'); } catch { /* noop */ }
      notify();
    },
    deactivate: () => {
      try { localStorage.removeItem(KEY); } catch { /* noop */ }
      notify();
    },
  };
}
