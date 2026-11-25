import { storage } from './storage.js';

const KEY = 'medilink.theme';

export function initialTheme() {
  const saved = storage.get(KEY);
  // Light by default; dark only when the user picks it.
  return saved === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  storage.set(KEY, theme);
}
