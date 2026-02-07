import { create } from 'zustand';
import type { Event } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { eventId as genEventId } from '../utils/id';

interface EventState {
  events: Event[];
  setEvents: (e: Event[]) => void;
  addEvent: (data: Omit<Event, 'id' | 'createdAt'>) => Event;
  updateEvent: (id: string, data: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
}

function loadFromLS(): Event[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.events);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(events: Event[]) {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
  sync.saveEvents(events);
}

export const useEventStore = create<EventState>((set, get) => ({
  events: loadFromLS(),

  setEvents: (e) => {
    set({ events: e });
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(e));
    sync.saveEvents(e);
  },

  addEvent: (data) => {
    const ev: Event = {
      ...data,
      id: genEventId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().events, ev];
    set({ events: next });
    persist(next);
    return ev;
  },

  updateEvent: (id, data) => {
    const next = get().events.map(e => e.id === id ? { ...e, ...data } : e);
    set({ events: next });
    persist(next);
  },

  deleteEvent: (id) => {
    sync.deleteEventDoc(id);
    const next = get().events.filter(e => e.id !== id);
    set({ events: next });
    persist(next);
  },
}));
