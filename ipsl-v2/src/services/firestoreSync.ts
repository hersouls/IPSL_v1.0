import {
  collection, doc, getDoc, getDocs,
  writeBatch, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Member, Transaction, Event, Fees, Settings, Schedule, VotingSession } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// ── LOAD ──────────────────────────────────────────

export async function loadSettings(): Promise<Settings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'config'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) };
    }
  } catch (e) {
    console.warn('Firestore loadSettings failed:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function loadMembers(): Promise<Member[]> {
  try {
    const snap = await getDocs(collection(db, 'members'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
    }
  } catch (e) {
    console.warn('Firestore loadMembers failed:', e);
  }
  return [];
}

export async function loadFees(): Promise<Fees> {
  try {
    const snap = await getDocs(collection(db, 'fees'));
    if (!snap.empty) {
      const fees: Fees = {};
      snap.docs.forEach(d => { fees[d.id] = d.data() as Record<string, Record<number, number>>; });
      return fees;
    }
  } catch (e) {
    console.warn('Firestore loadFees failed:', e);
  }
  return {};
}

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const snap = await getDocs(collection(db, 'transactions'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    }
  } catch (e) {
    console.warn('Firestore loadTransactions failed:', e);
  }
  return [];
}

export async function loadEvents(): Promise<Event[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Event));
    }
  } catch (e) {
    console.warn('Firestore loadEvents failed:', e);
  }
  return [];
}

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const snap = await getDocs(collection(db, 'schedules'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Schedule));
    }
  } catch (e) {
    console.warn('Firestore loadSchedules failed:', e);
  }
  return [];
}

export async function loadVotingSessions(): Promise<VotingSession[]> {
  try {
    const snap = await getDocs(collection(db, 'votingSessions'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as VotingSession));
    }
  } catch (e) {
    console.warn('Firestore loadVotingSessions failed:', e);
  }
  return [];
}

export async function loadAll() {
  const [settings, members, fees, transactions, events, schedules, votingSessions] = await Promise.allSettled([
    loadSettings(), loadMembers(), loadFees(), loadTransactions(), loadEvents(), loadSchedules(), loadVotingSessions(),
  ]);
  return {
    settings: settings.status === 'fulfilled' ? settings.value : { ...DEFAULT_SETTINGS },
    members: members.status === 'fulfilled' ? members.value : [],
    fees: fees.status === 'fulfilled' ? fees.value : {},
    transactions: transactions.status === 'fulfilled' ? transactions.value : [],
    events: events.status === 'fulfilled' ? events.value : [],
    schedules: schedules.status === 'fulfilled' ? schedules.value : [],
    votingSessions: votingSessions.status === 'fulfilled' ? votingSessions.value : [],
  };
}

// ── SAVE ──────────────────────────────────────────

export function saveSettings(settings: Settings) {
  const ref = doc(db, 'settings', 'config');
  const batch = writeBatch(db);
  batch.set(ref, JSON.parse(JSON.stringify(settings)));
  batch.commit().catch(e => console.warn('Firestore saveSettings failed:', e));
}

export function saveMembers(members: Member[]) {
  const batch = writeBatch(db);
  members.forEach(m => {
    const { id, ...data } = m;
    batch.set(doc(db, 'members', id), data);
  });
  batch.commit().catch(e => console.warn('Firestore saveMembers failed:', e));
}

export function saveFees(fees: Fees) {
  const batch = writeBatch(db);
  Object.keys(fees).forEach(year => {
    batch.set(doc(db, 'fees', year), fees[year]);
  });
  batch.commit().catch(e => console.warn('Firestore saveFees failed:', e));
}

export function saveTransactions(transactions: Transaction[]) {
  const batch = writeBatch(db);
  transactions.forEach(t => {
    const { id, ...data } = t;
    batch.set(doc(db, 'transactions', id), data);
  });
  batch.commit().catch(e => console.warn('Firestore saveTransactions failed:', e));
}

export function saveEvents(events: Event[]) {
  const batch = writeBatch(db);
  events.forEach(ev => {
    const { id, ...data } = ev;
    batch.set(doc(db, 'events', id), data);
  });
  batch.commit().catch(e => console.warn('Firestore saveEvents failed:', e));
}

// ── DELETE ─────────────────────────────────────────

export function deleteMemberDoc(memberId: string) {
  deleteDoc(doc(db, 'members', memberId))
    .catch(e => console.warn('Firestore deleteMember failed:', e));
}

export function deleteTransactionDoc(txId: string) {
  deleteDoc(doc(db, 'transactions', txId))
    .catch(e => console.warn('Firestore deleteTransaction failed:', e));
}

export function deleteEventDoc(eventId: string) {
  deleteDoc(doc(db, 'events', eventId))
    .catch(e => console.warn('Firestore deleteEvent failed:', e));
}

export function saveSchedules(schedules: Schedule[]) {
  const batch = writeBatch(db);
  schedules.forEach(sc => {
    const { id, ...data } = sc;
    batch.set(doc(db, 'schedules', id), data);
  });
  batch.commit().catch(e => console.warn('Firestore saveSchedules failed:', e));
}

export function deleteScheduleDoc(scheduleId: string) {
  deleteDoc(doc(db, 'schedules', scheduleId))
    .catch(e => console.warn('Firestore deleteSchedule failed:', e));
}

export function saveVotingSessions(sessions: VotingSession[]) {
  const batch = writeBatch(db);
  sessions.forEach(s => {
    const { id, ...data } = s;
    batch.set(doc(db, 'votingSessions', id), data);
  });
  batch.commit().catch(e => console.warn('Firestore saveVotingSessions failed:', e));
}

export function deleteVotingSessionDoc(sessionId: string) {
  deleteDoc(doc(db, 'votingSessions', sessionId))
    .catch(e => console.warn('Firestore deleteVotingSession failed:', e));
}

export async function clearAll() {
  const collections = ['settings', 'members', 'fees', 'transactions', 'events', 'schedules', 'votingSessions'];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Firestore clearAll failed for', col, e);
    }
  }
}
