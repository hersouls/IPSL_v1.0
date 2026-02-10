import { create } from 'zustand';
import type { BoardPost } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';
import { boardPostId as genId } from '../utils/id';

interface BoardPostState {
  boardPosts: BoardPost[];
  setBoardPosts: (posts: BoardPost[]) => void;
  addBoardPost: (data: Omit<BoardPost, 'id' | 'createdAt'>) => BoardPost;
  updateBoardPost: (id: string, data: Partial<BoardPost>) => void;
  deleteBoardPost: (id: string) => void;
  addComment: (postId: string, comment: Omit<import('../types').Comment, 'id' | 'createdAt'>) => void;
  deleteComment: (postId: string, commentId: string) => void;
  toggleReaction: (postId: string, emoji: string, userName: string) => void;
}

function loadFromLS(): BoardPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.boardPosts);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(boardPosts: BoardPost[]) {
  localStorage.setItem(STORAGE_KEYS.boardPosts, JSON.stringify(boardPosts));
  sync.saveBoardPosts(boardPosts);
}

export const useBoardPostStore = create<BoardPostState>((set, get) => ({
  boardPosts: loadFromLS(),

  setBoardPosts: (posts) => {
    set({ boardPosts: posts });
    localStorage.setItem(STORAGE_KEYS.boardPosts, JSON.stringify(posts));
    sync.saveBoardPosts(posts);
  },

  addBoardPost: (data) => {
    const item: BoardPost = {
      ...data,
      id: genId(),
      comments: [],
      createdAt: new Date().toISOString(),
    };
    const next = [...get().boardPosts, item];
    set({ boardPosts: next });
    persist(next);
    return item;
  },

  updateBoardPost: (id, data) => {
    const next = get().boardPosts.map(p => p.id === id ? { ...p, ...data } : p);
    set({ boardPosts: next });
    persist(next);
  },

  deleteBoardPost: (id) => {
    sync.deleteBoardPostDoc(id);
    const next = get().boardPosts.filter(p => p.id !== id);
    set({ boardPosts: next });
    persist(next);
  },

  addComment: (postId, commentData) => {
    const newComment = {
      ...commentData,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    const next = get().boardPosts.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: [...(p.comments || []), newComment] };
    });
    set({ boardPosts: next });
    persist(next);
  },

  deleteComment: (postId, commentId) => {
    const next = get().boardPosts.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) };
    });
    set({ boardPosts: next });
    persist(next);
  },

  toggleReaction: (postId, emoji, userName) => {
    const next = get().boardPosts.map(p => {
      if (p.id !== postId) return p;

      const reactions = p.reactions || [];
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

      return { ...p, reactions: newReactions };
    });
    set({ boardPosts: next });
    persist(next);
  },
}));
