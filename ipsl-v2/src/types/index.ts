export interface Member {
  id: string;
  name: string;
  degree: string;
  cohort: string;
  role: string;
  phone: string;
  email: string;
  emailCompany: string;
  company: string;
  birthday: string;
  memo: string;
  avatar?: string;
  pin: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'expense';
  date: string;
  amount: number;
  description: string;
  category: string | null;
  eventId: string | null;
  feeRef?: string | null;
  createdAt: string;
}

export interface Event {
  id: string;
  category: string;
  date: string;
  title: string;
  location: string;
  targetMember: string;
  participants: string[];
  amount: number;
  memo: string;
  txId: string | null;
  createdAt: string;
}

/** fees[year][memberId][monthIndex] = amount */
export type Fees = Record<string, Record<string, Record<number, number>>>;

export interface Settings {
  monthlyFee: number;
  condolence: number;
  smallGathering: number;
  smallGatheringCap: number;
  annualEvent: number;
  teachersDay: number;
}

export type TabId = 'announcements' | 'bylaws' | 'members' | 'fees' | 'support' | 'statements' | 'calendar' | 'voting';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  createdAt: string;
}

export type SupportCategoryKey = 'condolence' | 'smallGathering' | 'annualEvent' | 'teachersDay';

export interface SupportCategory {
  label: string;
  icon: string;
  color: string;
}

export type ScheduleLabel = 'meeting' | 'workshop' | 'conference' | 'anniversary' | 'custom';

export interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduleLabel: ScheduleLabel;
  location: string;
  memo: string;
  createdAt: string;
}

export type VoteChoice = 'approve' | 'reject' | 'abstain';
export type VotingTopic = 'officer' | 'fee' | 'amendment';
export type VotingStatus = 'open' | 'closed';

export interface VotingSession {
  id: string;
  topic: VotingTopic;
  title: string;
  description: string;
  status: VotingStatus;
  votes: Record<string, VoteChoice>;
  autoApproved: string[];
  endDate: string;
  createdAt: string;
  closedAt: string | null;
}

export interface RevisionEntry {
  date: string;
  version: string;
  editor: string;
  summary: string;
  details: string[];
}
