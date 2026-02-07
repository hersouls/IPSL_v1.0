import { create } from 'zustand';
import type { Fees } from '../types';
import { STORAGE_KEYS } from '../constants';
import * as sync from '../services/firestoreSync';

interface FeeState {
  fees: Fees;
  setFees: (f: Fees) => void;
  setFee: (year: string, memberId: string, month: number, amount: number) => void;
  deleteFee: (year: string, memberId: string, month: number) => void;
  deleteMemberFees: (memberId: string) => void;
}

function loadFromLS(): Fees {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.fees);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function persist(fees: Fees) {
  localStorage.setItem(STORAGE_KEYS.fees, JSON.stringify(fees));
  sync.saveFees(fees);
}

export const useFeeStore = create<FeeState>((set, get) => ({
  fees: loadFromLS(),

  setFees: (f) => {
    set({ fees: f });
    localStorage.setItem(STORAGE_KEYS.fees, JSON.stringify(f));
    sync.saveFees(f);
  },

  setFee: (year, memberId, month, amount) => {
    const fees = structuredClone(get().fees);
    if (!fees[year]) fees[year] = {};
    if (!fees[year][memberId]) fees[year][memberId] = {};
    fees[year][memberId][month] = amount;
    set({ fees });
    persist(fees);
  },

  deleteFee: (year, memberId, month) => {
    const fees = structuredClone(get().fees);
    if (fees[year]?.[memberId]) {
      fees[year][memberId][month] = 0;
    }
    set({ fees });
    persist(fees);
  },

  deleteMemberFees: (memberId) => {
    const fees = structuredClone(get().fees);
    Object.keys(fees).forEach(year => {
      if (fees[year][memberId]) delete fees[year][memberId];
    });
    set({ fees });
    persist(fees);
  },
}));
