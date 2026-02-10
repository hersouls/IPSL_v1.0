import { create } from 'zustand';
import type { TabId } from '../types';

interface ToastData {
  message: string;
  visible: boolean;
}

interface ConfirmModalData {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor: 'red' | 'navy';
  onConfirm: (() => void) | null;
}

interface UiState {
  // Tab
  currentTab: TabId;
  switchTab: (tab: TabId) => void;

  // Modals
  memberModalOpen: boolean;
  editMemberId: string | null;
  openMemberModal: (id?: string | null) => void;
  closeMemberModal: () => void;

  feeModalOpen: boolean;
  feeEditTarget: { memberId: string; year: string; month: number } | null;
  openFeeModal: (memberId: string, year: string, month: number) => void;
  closeFeeModal: () => void;

  txModalOpen: boolean;
  editTxId: string | null;
  openTxModal: (id?: string | null) => void;
  closeTxModal: () => void;

  eventModalOpen: boolean;
  editEventId: string | null;
  openEventModal: (id?: string | null) => void;
  closeEventModal: () => void;

  settingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  scheduleModalOpen: boolean;
  editScheduleId: string | null;
  scheduleModalDate: string | null;
  openScheduleModal: (id?: string | null, date?: string | null) => void;
  closeScheduleModal: () => void;

  votingModalOpen: boolean;
  editVotingSessionId: string | null;
  openVotingModal: (id?: string | null) => void;
  closeVotingModal: () => void;

  voteAuthModalOpen: boolean;
  voteAuthSessionId: string | null;
  openVoteAuthModal: (sessionId: string) => void;
  closeVoteAuthModal: () => void;

  announcementModalOpen: boolean;
  editAnnouncementId: string | null;
  openAnnouncementModal: (id?: string | null) => void;
  closeAnnouncementModal: () => void;

  boardPostModalOpen: boolean;
  editBoardPostId: string | null;
  openBoardPostModal: (id?: string | null) => void;
  closeBoardPostModal: () => void;
  // Terms modal
  termsModalOpen: boolean;
  openTermsModal: () => void;
  closeTermsModal: () => void;

  // Calendar
  calYear: number;
  calMonth: number;
  calSelectedDate: string | null;
  calPrevMonth: () => void;
  calNextMonth: () => void;
  calGoToday: () => void;
  calSelectDate: (dateStr: string) => void;

  // Toast
  toast: ToastData;
  showToast: (message: string) => void;

  // Confirm modal
  confirmModal: ConfirmModalData;
  openConfirmModal: (opts: { title: string; description: string; confirmLabel?: string; confirmColor?: 'red' | 'navy'; onConfirm: () => void }) => void;
  closeConfirmModal: () => void;

  // Dark mode
  isDark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

function loadDarkMode(): boolean {
  const s = localStorage.getItem('ipsl_darkMode');
  if (s === 'dark') return true;
  if (s === 'light') return false;
  return false; // white mode default
}

export const useUiStore = create<UiState>((set, get) => ({
  // Tab
  currentTab: 'announcements',
  switchTab: (tab) => set({ currentTab: tab }),

  // Member modal
  memberModalOpen: false,
  editMemberId: null,
  openMemberModal: (id = null) => set({ memberModalOpen: true, editMemberId: id ?? null }),
  closeMemberModal: () => set({ memberModalOpen: false, editMemberId: null }),

  // Fee modal
  feeModalOpen: false,
  feeEditTarget: null,
  openFeeModal: (memberId, year, month) =>
    set({ feeModalOpen: true, feeEditTarget: { memberId, year, month } }),
  closeFeeModal: () => set({ feeModalOpen: false, feeEditTarget: null }),

  // Tx modal
  txModalOpen: false,
  editTxId: null,
  openTxModal: (id = null) => set({ txModalOpen: true, editTxId: id ?? null }),
  closeTxModal: () => set({ txModalOpen: false, editTxId: null }),

  // Event modal
  eventModalOpen: false,
  editEventId: null,
  openEventModal: (id = null) => set({ eventModalOpen: true, editEventId: id ?? null }),
  closeEventModal: () => set({ eventModalOpen: false, editEventId: null }),

  // Settings modal
  settingsModalOpen: false,
  openSettingsModal: () => set({ settingsModalOpen: true }),
  closeSettingsModal: () => set({ settingsModalOpen: false }),

  // Schedule modal
  scheduleModalOpen: false,
  editScheduleId: null,
  scheduleModalDate: null,
  openScheduleModal: (id = null, date = null) => set({
    scheduleModalOpen: true,
    editScheduleId: id ?? null,
    scheduleModalDate: date ?? null,
  }),
  closeScheduleModal: () => set({
    scheduleModalOpen: false,
    editScheduleId: null,
    scheduleModalDate: null,
  }),

  // Voting modal
  votingModalOpen: false,
  editVotingSessionId: null,
  openVotingModal: (id = null) => set({ votingModalOpen: true, editVotingSessionId: id ?? null }),
  closeVotingModal: () => set({ votingModalOpen: false, editVotingSessionId: null }),

  // Vote auth modal
  voteAuthModalOpen: false,
  voteAuthSessionId: null,
  openVoteAuthModal: (sessionId) => set({ voteAuthModalOpen: true, voteAuthSessionId: sessionId }),
  closeVoteAuthModal: () => set({ voteAuthModalOpen: false, voteAuthSessionId: null }),

  // Announcement modal
  announcementModalOpen: false,
  editAnnouncementId: null,
  openAnnouncementModal: (id = null) => set({ announcementModalOpen: true, editAnnouncementId: id ?? null }),
  closeAnnouncementModal: () => set({ announcementModalOpen: false, editAnnouncementId: null }),

  // Board post modal
  boardPostModalOpen: false,
  editBoardPostId: null,
  openBoardPostModal: (id = null) => set({ boardPostModalOpen: true, editBoardPostId: id ?? null }),
  closeBoardPostModal: () => set({ boardPostModalOpen: false, editBoardPostId: null }),

  // Terms modal
  termsModalOpen: false,
  openTermsModal: () => set({ termsModalOpen: true }),
  closeTermsModal: () => set({ termsModalOpen: false }),

  // Calendar
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calSelectedDate: null,
  calPrevMonth: () => {
    const { calMonth, calYear } = get();
    if (calMonth === 0) {
      set({ calMonth: 11, calYear: calYear - 1, calSelectedDate: null });
    } else {
      set({ calMonth: calMonth - 1, calSelectedDate: null });
    }
  },
  calNextMonth: () => {
    const { calMonth, calYear } = get();
    if (calMonth === 11) {
      set({ calMonth: 0, calYear: calYear + 1, calSelectedDate: null });
    } else {
      set({ calMonth: calMonth + 1, calSelectedDate: null });
    }
  },
  calGoToday: () => {
    const today = new Date();
    set({
      calYear: today.getFullYear(),
      calMonth: today.getMonth(),
      calSelectedDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    });
  },
  calSelectDate: (dateStr) => {
    set(state => ({ calSelectedDate: state.calSelectedDate === dateStr ? null : dateStr }));
  },

  // Toast
  toast: { message: '', visible: false },
  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => set({ toast: { message: '', visible: false } }), 2500);
  },

  // Confirm modal
  confirmModal: { open: false, title: '', description: '', confirmLabel: '삭제', confirmColor: 'red', onConfirm: null },
  openConfirmModal: (opts) => set({
    confirmModal: {
      open: true,
      title: opts.title,
      description: opts.description,
      confirmLabel: opts.confirmLabel || '삭제',
      confirmColor: opts.confirmColor || 'red',
      onConfirm: opts.onConfirm,
    },
  }),
  closeConfirmModal: () => set({
    confirmModal: { open: false, title: '', description: '', confirmLabel: '삭제', confirmColor: 'red', onConfirm: null },
  }),

  // Dark mode
  isDark: loadDarkMode(),
  toggleDark: () => {
    const next = !get().isDark;
    set({ isDark: next });
    localStorage.setItem('ipsl_darkMode', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  },
  setDark: (dark) => {
    set({ isDark: dark });
    document.documentElement.classList.toggle('dark', dark);
  },
}));
