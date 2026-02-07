import { create } from 'zustand';
import type { VotingSession, VoteChoice } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { votingSessionId as genId } from '../utils/id';

interface VotingState {
  sessions: VotingSession[];
  setSessions: (s: VotingSession[]) => void;
  addSession: (data: Omit<VotingSession, 'id' | 'createdAt' | 'closedAt' | 'votes' | 'autoApproved'>) => VotingSession;
  updateSession: (id: string, data: Partial<VotingSession>) => void;
  deleteSession: (id: string) => void;
  castVote: (sessionId: string, memberId: string, choice: VoteChoice) => void;
  closeSession: (id: string, memberIds: string[]) => void;
}

function loadFromLS(): VotingSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.votingSessions);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(sessions: VotingSession[]) {
  localStorage.setItem(STORAGE_KEYS.votingSessions, JSON.stringify(sessions));
  sync.saveVotingSessions(sessions);
}

export const useVotingStore = create<VotingState>((set, get) => ({
  sessions: loadFromLS(),

  setSessions: (s) => {
    set({ sessions: s });
    localStorage.setItem(STORAGE_KEYS.votingSessions, JSON.stringify(s));
    sync.saveVotingSessions(s);
  },

  addSession: (data) => {
    const session: VotingSession = {
      ...data,
      id: genId(),
      votes: {},
      autoApproved: [],
      closedAt: null,
      createdAt: new Date().toISOString(),
    };
    const next = [...get().sessions, session];
    set({ sessions: next });
    persist(next);
    return session;
  },

  updateSession: (id, data) => {
    const next = get().sessions.map(s => s.id === id ? { ...s, ...data } : s);
    set({ sessions: next });
    persist(next);
  },

  deleteSession: (id) => {
    sync.deleteVotingSessionDoc(id);
    const next = get().sessions.filter(s => s.id !== id);
    set({ sessions: next });
    persist(next);
  },

  castVote: (sessionId, memberId, choice) => {
    const next = get().sessions.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, votes: { ...s.votes, [memberId]: choice } };
    });
    set({ sessions: next });
    persist(next);
  },

  closeSession: (id, memberIds) => {
    const next = get().sessions.map(s => {
      if (s.id !== id) return s;
      // Positive voting: non-voters auto-approve
      const autoVotes = { ...s.votes };
      const autoApprovedIds: string[] = [];
      for (const mid of memberIds) {
        if (!autoVotes[mid]) {
          autoVotes[mid] = 'approve';
          autoApprovedIds.push(mid);
        }
      }
      return { ...s, status: 'closed' as const, votes: autoVotes, autoApproved: autoApprovedIds, closedAt: new Date().toISOString() };
    });
    set({ sessions: next });
    persist(next);
  },
}));
