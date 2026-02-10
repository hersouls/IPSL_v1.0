import {
  collection, doc, getDoc, getDocs,
  writeBatch, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Member, Transaction, Event, Fees, Settings, Schedule, VotingSession, Announcement, BoardPost } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// ── LOAD ──────────────────────────────────────────

export async function loadSettings(): Promise<Settings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'config'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) };
    }
  } catch {
    // silent
  }
  return { ...DEFAULT_SETTINGS };
}

export async function loadMembers(): Promise<Member[]> {
  try {
    const snap = await getDocs(collection(db, 'members'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
    }
  } catch {
    // silent
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
  } catch {
    // silent
  }
  return {};
}

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const snap = await getDocs(collection(db, 'transactions'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadEvents(): Promise<Event[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Event));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const snap = await getDocs(collection(db, 'schedules'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Schedule));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadVotingSessions(): Promise<VotingSession[]> {
  try {
    const snap = await getDocs(collection(db, 'votingSessions'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as VotingSession));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadBoardPosts(): Promise<BoardPost[]> {
  try {
    const snap = await getDocs(collection(db, 'boardPosts'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BoardPost));
    }
  } catch {
    // silent
  }
  return [];
}

export async function loadAll() {
  const [settings, members, fees, transactions, events, schedules, votingSessions, announcements, boardPosts] = await Promise.allSettled([
    loadSettings(), loadMembers(), loadFees(), loadTransactions(), loadEvents(), loadSchedules(), loadVotingSessions(), loadAnnouncements(), loadBoardPosts(),
  ]);
  return {
    settings: settings.status === 'fulfilled' ? settings.value : { ...DEFAULT_SETTINGS },
    members: members.status === 'fulfilled' ? members.value : [],
    fees: fees.status === 'fulfilled' ? fees.value : {},
    transactions: transactions.status === 'fulfilled' ? transactions.value : [],
    events: events.status === 'fulfilled' ? events.value : [],
    schedules: schedules.status === 'fulfilled' ? schedules.value : [],
    votingSessions: votingSessions.status === 'fulfilled' ? votingSessions.value : [],
    announcements: announcements.status === 'fulfilled' ? announcements.value : [],
    boardPosts: boardPosts.status === 'fulfilled' ? boardPosts.value : [],
  };
}

// ── SAVE ──────────────────────────────────────────

export function saveSettings(settings: Settings) {
  const ref = doc(db, 'settings', 'config');
  const batch = writeBatch(db);
  batch.set(ref, JSON.parse(JSON.stringify(settings)));
  batch.commit().catch(() => {});
}

export function saveMembers(members: Member[]) {
  const batch = writeBatch(db);
  members.forEach(m => {
    const { id, ...data } = m;
    batch.set(doc(db, 'members', id), data);
  });
  batch.commit().catch(() => {});
}

export function saveFees(fees: Fees) {
  const batch = writeBatch(db);
  Object.keys(fees).forEach(year => {
    batch.set(doc(db, 'fees', year), fees[year]);
  });
  batch.commit().catch(() => {});
}

export function saveTransactions(transactions: Transaction[]) {
  const batch = writeBatch(db);
  transactions.forEach(t => {
    const { id, ...data } = t;
    batch.set(doc(db, 'transactions', id), data);
  });
  batch.commit().catch(() => {});
}

export function saveEvents(events: Event[]) {
  const batch = writeBatch(db);
  events.forEach(ev => {
    const { id, ...data } = ev;
    batch.set(doc(db, 'events', id), data);
  });
  batch.commit().catch(() => {});
}

// ── DELETE ─────────────────────────────────────────

export function deleteMemberDoc(memberId: string) {
  deleteDoc(doc(db, 'members', memberId))
    .catch(() => {});
}

export function deleteTransactionDoc(txId: string) {
  deleteDoc(doc(db, 'transactions', txId))
    .catch(() => {});
}

export function deleteEventDoc(eventId: string) {
  deleteDoc(doc(db, 'events', eventId))
    .catch(() => {});
}

export function saveSchedules(schedules: Schedule[]) {
  const batch = writeBatch(db);
  schedules.forEach(sc => {
    const { id, ...data } = sc;
    batch.set(doc(db, 'schedules', id), data);
  });
  batch.commit().catch(() => {});
}

export function deleteScheduleDoc(scheduleId: string) {
  deleteDoc(doc(db, 'schedules', scheduleId))
    .catch(() => {});
}

export function saveVotingSessions(sessions: VotingSession[]) {
  const batch = writeBatch(db);
  sessions.forEach(s => {
    const { id, ...data } = s;
    batch.set(doc(db, 'votingSessions', id), data);
  });
  batch.commit().catch(() => {});
}

export function deleteVotingSessionDoc(sessionId: string) {
  deleteDoc(doc(db, 'votingSessions', sessionId))
    .catch(() => {});
}

export function saveAnnouncements(announcements: Announcement[]) {
  const batch = writeBatch(db);
  announcements.forEach(a => {
    const { id, ...data } = a;
    batch.set(doc(db, 'announcements', id), data);
  });
  batch.commit().catch(() => {});
}

export function deleteAnnouncementDoc(announcementId: string) {
  deleteDoc(doc(db, 'announcements', announcementId))
    .catch(() => {});
}

export function saveBoardPosts(boardPosts: BoardPost[]) {
  const batch = writeBatch(db);
  boardPosts.forEach(p => {
    const { id, ...data } = p;
    batch.set(doc(db, 'boardPosts', id), data);
  });
  batch.commit().catch(() => {});
}

export function deleteBoardPostDoc(boardPostId: string) {
  deleteDoc(doc(db, 'boardPosts', boardPostId))
    .catch(() => {});
}

export async function clearAll() {
  const collections = ['settings', 'members', 'fees', 'transactions', 'events', 'schedules', 'votingSessions', 'announcements', 'boardPosts'];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch {
      // silent
    }
  }
}
