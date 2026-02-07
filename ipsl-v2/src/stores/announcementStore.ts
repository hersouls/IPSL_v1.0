import { create } from 'zustand';
import type { Announcement } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { announcementId as genId } from '../utils/id';

interface AnnouncementState {
  announcements: Announcement[];
  setAnnouncements: (a: Announcement[]) => void;
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => Announcement;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
}

function loadFromLS(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.announcements);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(announcements: Announcement[]) {
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(announcements));
  sync.saveAnnouncements(announcements);
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: loadFromLS(),

  setAnnouncements: (a) => {
    set({ announcements: a });
    localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(a));
    sync.saveAnnouncements(a);
  },

  addAnnouncement: (data) => {
    const item: Announcement = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().announcements, item];
    set({ announcements: next });
    persist(next);
    return item;
  },

  updateAnnouncement: (id, data) => {
    const next = get().announcements.map(a => a.id === id ? { ...a, ...data } : a);
    set({ announcements: next });
    persist(next);
  },

  deleteAnnouncement: (id) => {
    sync.deleteAnnouncementDoc(id);
    const next = get().announcements.filter(a => a.id !== id);
    set({ announcements: next });
    persist(next);
  },
}));
