import { create } from 'zustand';
import type { Schedule } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { scheduleId as genScheduleId } from '../utils/id';

interface ScheduleState {
  schedules: Schedule[];
  setSchedules: (s: Schedule[]) => void;
  addSchedule: (data: Omit<Schedule, 'id' | 'createdAt'>) => Schedule;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
}

function loadFromLS(): Schedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.schedules);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(schedules: Schedule[]) {
  localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(schedules));
  sync.saveSchedules(schedules);
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: loadFromLS(),

  setSchedules: (s) => {
    set({ schedules: s });
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(s));
    sync.saveSchedules(s);
  },

  addSchedule: (data) => {
    const sc: Schedule = {
      ...data,
      id: genScheduleId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().schedules, sc];
    set({ schedules: next });
    persist(next);
    return sc;
  },

  updateSchedule: (id, data) => {
    const next = get().schedules.map(s => s.id === id ? { ...s, ...data } : s);
    set({ schedules: next });
    persist(next);
  },

  deleteSchedule: (id) => {
    sync.deleteScheduleDoc(id);
    const next = get().schedules.filter(s => s.id !== id);
    set({ schedules: next });
    persist(next);
  },
}));
