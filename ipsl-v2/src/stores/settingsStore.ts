import { create } from 'zustand';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';

interface SettingsState {
  settings: Settings;
  setSettings: (s: Settings) => void;
  updateSettings: (partial: Partial<Settings>) => void;
}

function loadFromLS(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadFromLS(),

  setSettings: (s) => {
    set({ settings: s });
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s));
    sync.saveSettings(s);
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    get().setSettings(next);
  },
}));
