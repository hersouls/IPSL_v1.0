import type { Settings, SupportCategory, SupportCategoryKey, RevisionEntry } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  monthlyFee: 10000,
  condolence: 70000,
  smallGathering: 20000,
  smallGatheringCap: 800000,
  annualEvent: 2000000,
  teachersDay: 300000,
};

export const SUPPORT_CATS: Record<SupportCategoryKey, SupportCategory> = {
  condolence: { label: '경조사', icon: 'heart', color: 'navy' },
  smallGathering: { label: '소모임', icon: 'users-round', color: 'navy' },
  annualEvent: { label: '연례행사', icon: 'calendar-heart', color: 'navy' },
  teachersDay: { label: '스승의날', icon: 'graduation-cap', color: 'navy' },
};

export const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] as const;

export const STORAGE_KEYS = {
  settings: 'ipsl_settings',
  members: 'ipsl_members',
  fees: 'ipsl_fees',
  transactions: 'ipsl_transactions',
  events: 'ipsl_events',
  darkMode: 'ipsl_darkMode',
  settingsPin: 'ipsl_settingsPin',
  schedules: 'ipsl_schedules',
  votingSessions: 'ipsl_votingSessions',
  announcements: 'ipsl_announcements',
} as const;

export const DEFAULT_SETTINGS_PIN = '9876';
export const DEFAULT_MEMBER_PIN = '0000';
export const MASTER_PIN = '9876';

export const REVISION_HISTORY: RevisionEntry[] = [
  {
    date: '2026-02-07',
    version: '1.1',
    editor: 'IPSL Alumni',
    summary: '의결 정족수 및 찬성 기준 개정',
    details: [
      '제1조 임원진 선출: 2/3 이상 참석, 4/5 이상 찬성으로 변경',
      '제2조 회비 조정: 1/2 이상 참석, 3/5 이상 찬성으로 변경',
      '제9조 회칙 개정: 2/3 이상 참석, 3/5 이상 찬성으로 변경',
    ],
  },
  {
    date: '2026-02-06',
    version: '1.0',
    editor: 'IPSL Alumni',
    summary: '회칙 최초 제정',
    details: [
      '제1조 임원진 구성 및 임기 규정',
      '제2조 회비 (월 1만원) 및 운영 원칙 확립',
      '제3조~7조 경조사/소모임/행사/예비비 규정 신설',
      '제8조 내역 공개 및 투명성 보장 조항',
      '제9조 개정 절차 수립',
    ],
  },
];

export const COHORT_START_YEAR = 2009;

export const VOTING_TOPICS: Record<string, { label: string; article: string; quorum: number; threshold: number; quorumLabel: string; thresholdLabel: string }> = {
  officer:   { label: '임원진 구성', article: '제1조', quorum: 2/3, threshold: 4/5, quorumLabel: '2/3', thresholdLabel: '4/5' },
  fee:       { label: '회비 변경',   article: '제2조', quorum: 1/2, threshold: 3/5, quorumLabel: '1/2', thresholdLabel: '3/5' },
  amendment: { label: '회칙 개정',   article: '제9조', quorum: 2/3, threshold: 3/5, quorumLabel: '2/3', thresholdLabel: '3/5' },
};

export const VOTE_CHOICES: Record<string, { label: string; color: string }> = {
  approve: { label: '찬성', color: 'emerald' },
  reject:  { label: '반대', color: 'red' },
  abstain: { label: '기권', color: 'zinc' },
};

export const SCHEDULE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  meeting:     { label: '정기 모임', icon: 'users',           color: 'violet' },
  workshop:    { label: '워크샵',    icon: 'presentation',    color: 'amber'  },
  conference:  { label: '회의',      icon: 'message-square',  color: 'teal'   },
  anniversary: { label: '기념일',    icon: 'party-popper',    color: 'rose'   },
  custom:      { label: '기타 일정', icon: 'calendar-plus',   color: 'sky'    },
};
