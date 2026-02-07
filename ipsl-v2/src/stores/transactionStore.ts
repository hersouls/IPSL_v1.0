import { create } from 'zustand';
import type { Transaction } from '../types';
import { STORAGE_KEYS, SUPPORT_CATS } from '../constants';
import * as sync from '../services/firestoreSync';
import { transactionId as genTxId, eventId as genEvId } from '../utils/id';
import { useEventStore } from './eventStore';
import type { SupportCategoryKey } from '../types';

interface TransactionState {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

function loadFromLS(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  sync.saveTransactions(transactions);
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: loadFromLS(),

  setTransactions: (t) => {
    set({ transactions: t });
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(t));
    sync.saveTransactions(t);
  },

  addTransaction: (data) => {
    const tx: Transaction = {
      ...data,
      id: genTxId(),
      createdAt: new Date().toISOString(),
    };

    // Auto-create linked event for expense with category
    if (tx.type === 'expense' && tx.category) {
      const catLabel = SUPPORT_CATS[tx.category as SupportCategoryKey]?.label || '';
      const ev = useEventStore.getState().addEvent({
        category: tx.category,
        date: tx.date,
        title: tx.description || catLabel,
        location: '',
        targetMember: '',
        participants: [],
        amount: tx.amount,
        memo: '',
        txId: tx.id,
      });
      tx.eventId = ev.id;
    }

    const next = [...get().transactions, tx];
    set({ transactions: next });
    persist(next);
  },

  updateTransaction: (id, data) => {
    const existing = get().transactions.find(t => t.id === id);
    if (!existing) return;

    const updated = { ...existing, ...data };
    const eventStore = useEventStore.getState();

    if (existing.eventId) {
      if (updated.type === 'expense' && updated.category) {
        // Update linked event
        eventStore.updateEvent(existing.eventId, {
          date: updated.date,
          amount: updated.amount,
          title: updated.description || undefined,
          category: updated.category,
        });
      } else {
        // Changed to deposit or no category — remove linked event
        eventStore.deleteEvent(existing.eventId);
        updated.eventId = null;
      }
    } else if (updated.type === 'expense' && updated.category) {
      // No linked event yet — create one
      const catLabel = SUPPORT_CATS[updated.category as SupportCategoryKey]?.label || '';
      const ev = eventStore.addEvent({
        category: updated.category,
        date: updated.date,
        title: updated.description || catLabel,
        location: '',
        targetMember: '',
        participants: [],
        amount: updated.amount,
        memo: '',
        txId: id,
      });
      updated.eventId = ev.id;
    }

    const next = get().transactions.map(t => t.id === id ? updated : t);
    set({ transactions: next });
    persist(next);
  },

  deleteTransaction: (id) => {
    const tx = get().transactions.find(t => t.id === id);
    if (tx?.eventId) {
      useEventStore.getState().deleteEvent(tx.eventId);
    }
    sync.deleteTransactionDoc(id);
    const next = get().transactions.filter(t => t.id !== id);
    set({ transactions: next });
    persist(next);
  },
}));
