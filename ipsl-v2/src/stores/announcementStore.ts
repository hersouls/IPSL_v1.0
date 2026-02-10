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
  addComment: (announcementId: string, comment: Omit<import('../types').Comment, 'id' | 'createdAt'>) => void;
  deleteComment: (announcementId: string, commentId: string) => void;
  toggleReaction: (announcementId: string, emoji: string, userName: string) => void;
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
      comments: [],
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

  addComment: (announcementId, commentData) => {
    const newComment = {
      ...commentData,
      id: genId(), // Using same ID generator for simplicity, or create a new one if needed. But usually distinct enough.
      createdAt: new Date().toISOString(),
    };
    const next = get().announcements.map(a => {
      if (a.id !== announcementId) return a;
      return { ...a, comments: [...(a.comments || []), newComment] };
    });
    set({ announcements: next });
    persist(next);
  },

  deleteComment: (announcementId, commentId) => {
    const next = get().announcements.map(a => {
      if (a.id !== announcementId) return a;
      return { ...a, comments: (a.comments || []).filter(c => c.id !== commentId) };
    });
    set({ announcements: next });
    persist(next);
  },

  toggleReaction: (announcementId, emoji, userName) => {
    const next = get().announcements.map(a => {
      if (a.id !== announcementId) return a;

      const reactions = a.reactions || [];
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);

      let newReactions = [...reactions];

      if (existingReactionIndex >= 0) {
        // Reaction exists for this emoji
        const existing = reactions[existingReactionIndex];
        const userIndex = existing.users.indexOf(userName);

        if (userIndex >= 0) {
          // User already reacted with this emoji -> remove reaction
          const newUsers = [...existing.users];
          newUsers.splice(userIndex, 1);
          if (newUsers.length === 0) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = { ...existing, users: newUsers, count: newUsers.length };
          }
        } else {
          // User adds reaction to this emoji
          newReactions[existingReactionIndex] = { ...existing, users: [...existing.users, userName], count: existing.count + 1 };
        }
      } else {
        // New emoji reaction
        newReactions.push({ emoji, count: 1, users: [userName] });
      }

      return { ...a, reactions: newReactions };
    });
    set({ announcements: next });
    persist(next);
  },
}));
