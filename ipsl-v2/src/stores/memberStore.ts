import { create } from 'zustand';
import type { Member } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { memberId } from '../utils/id';

interface MemberState {
  members: Member[];
  setMembers: (m: Member[]) => void;
  addMember: (data: Omit<Member, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, data: Partial<Member>) => void;
  deleteMember: (id: string) => void;
}

function loadFromLS(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.members);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(members: Member[]) {
  localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(members));
  sync.saveMembers(members);
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: loadFromLS(),

  setMembers: (m) => {
    set({ members: m });
    localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(m));
    sync.saveMembers(m);
  },

  addMember: (data) => {
    const member: Member = {
      ...data,
      id: memberId(),
      createdAt: new Date().toISOString(),
    } as Member;
    const next = [...get().members, member];
    set({ members: next });
    persist(next);
  },

  updateMember: (id, data) => {
    const next = get().members.map(m => m.id === id ? { ...m, ...data } : m);
    set({ members: next });
    persist(next);
  },

  deleteMember: (id) => {
    sync.deleteMemberDoc(id);
    const next = get().members.filter(m => m.id !== id);
    set({ members: next });
    persist(next);
  },
}));
