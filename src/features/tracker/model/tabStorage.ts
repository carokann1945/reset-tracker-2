'use client';

import type { TabState } from './types';
export const STORAGE_KEY = 'tabs-todolist:v1';

export function loadState(): TabState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const state = parsed as TabState;
    if (state.version !== 1) return null;
    if (!Array.isArray(state.tabs)) return null;

    return state;
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
