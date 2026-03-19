import type { TabState } from './types';

export const STORAGE_KEY = 'reset-tracker-tabs:v1';

export function loadState(): TabState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed as TabState;
  } catch {
    return null;
  }
}

export function saveState(state: TabState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
