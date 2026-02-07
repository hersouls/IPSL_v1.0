import { useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as firestoreSync from '../services/firestoreSync';
import { useSettingsStore } from '../stores/settingsStore';
import { useMemberStore } from '../stores/memberStore';
import { useFeeStore } from '../stores/feeStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useEventStore } from '../stores/eventStore';
import { useScheduleStore } from '../stores/scheduleStore';
import { useVotingStore } from '../stores/votingStore';
import { useAnnouncementStore } from '../stores/announcementStore';
import { useUiStore } from '../stores/uiStore';
import { DEFAULT_MEMBER_PIN } from '../constants';

export function useFirestoreSync() {
  const initialized = useRef(false);
  const showToast = useUiStore(s => s.showToast);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const data = await firestoreSync.loadAll();

        // Only update stores if Firestore has data
        const hasFirestoreData =
          data.members.length > 0 ||
          Object.keys(data.fees).length > 0 ||
          data.transactions.length > 0 ||
          data.events.length > 0 ||
          data.schedules.length > 0 ||
          data.votingSessions.length > 0 ||
          data.announcements.length > 0;

        if (hasFirestoreData) {
          useSettingsStore.getState().setSettings(data.settings);
          useMemberStore.getState().setMembers(data.members);
          useFeeStore.getState().setFees(data.fees);
          useTransactionStore.getState().setTransactions(data.transactions);
          useEventStore.getState().setEvents(data.events);
          useScheduleStore.getState().setSchedules(data.schedules);
          useVotingStore.getState().setSessions(data.votingSessions);
          useAnnouncementStore.getState().setAnnouncements(data.announcements);
        } else {
          // Auto-migrate localStorage → Firestore if Firestore is empty
          const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
          const localMembers = useMemberStore.getState().members;
          if (!settingsDoc.exists() && localMembers.length > 0) {
            console.log('localStorage → Firestore migration');
            firestoreSync.saveSettings(useSettingsStore.getState().settings);
            firestoreSync.saveMembers(localMembers);
            firestoreSync.saveFees(useFeeStore.getState().fees);
            firestoreSync.saveTransactions(useTransactionStore.getState().transactions);
            firestoreSync.saveEvents(useEventStore.getState().events);
            firestoreSync.saveSchedules(useScheduleStore.getState().schedules);
            firestoreSync.saveVotingSessions(useVotingStore.getState().sessions);
            firestoreSync.saveAnnouncements(useAnnouncementStore.getState().announcements);
            showToast('클라우드 동기화가 완료되었습니다');
          }
        }

        // Migrate members without pin
        migrateMembers();
        // Migrate old boolean fees
        migrateFees();
        // Migrate transactions
        migrateTransactions();

        console.log('Firestore 동기화 완료');
      } catch (err) {
        console.warn('Firestore 백그라운드 동기화 실패:', err);
      }
    })();
  }, [showToast]);
}

function migrateMembers() {
  const { members, setMembers } = useMemberStore.getState();
  let changed = false;
  const clone = members.map(m => {
    if (!m.pin) {
      changed = true;
      return { ...m, pin: DEFAULT_MEMBER_PIN };
    }
    return m;
  });
  if (changed) setMembers(clone);
}

function migrateFees() {
  const { fees, setFees } = useFeeStore.getState();
  const settings = useSettingsStore.getState().settings;
  let changed = false;
  const clone = structuredClone(fees);

  Object.keys(clone).forEach(year => {
    Object.keys(clone[year]).forEach(mid => {
      Object.keys(clone[year][mid]).forEach(mo => {
        const v = clone[year][mid][Number(mo)];
        if (v === true as unknown) {
          clone[year][mid][Number(mo)] = settings.monthlyFee;
          changed = true;
        } else if (v === false as unknown) {
          clone[year][mid][Number(mo)] = 0;
          changed = true;
        }
      });
    });
  });

  if (changed) setFees(clone);
}

function migrateTransactions() {
  const { transactions, setTransactions } = useTransactionStore.getState();
  let changed = false;
  const clone = transactions.map(tx => {
    const t = { ...tx };
    if (t.category === undefined) { t.category = null; changed = true; }
    if (t.eventId === undefined) { t.eventId = null; changed = true; }
    return t;
  });
  if (changed) setTransactions(clone);
}
