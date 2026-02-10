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

export type TabId = 'announcements' | 'bylaws' | 'members' | 'fees' | 'support' | 'statements' | 'calendar' | 'voting' | 'board';

export interface AnnouncementAttachment {
  name: string;
  dataUrl: string;
}

export interface Comment {
  id: string;
  author: string;
  password: string;
  content: string;
  createdAt: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user names
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  location: string;
  link: string;
  attachments: AnnouncementAttachment[];
  pinned: boolean;
  comments?: Comment[];
  reactions?: Reaction[];
  createdAt: string;
}

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  author: string;
  location: string;
  link: string;
  memo: string;
  comments?: Comment[];
  reactions?: Reaction[];
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

// Badge system
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special';

export type BadgeId =
  | 'first-payment' | 'streak-3' | 'streak-6' | 'perfect-year' | 'early-bird' | 'super-early'
  | 'profile-basic' | 'profile-complete' | 'avatar-set'
  | 'first-post' | 'active-writer' | 'first-comment' | 'announcer' | 'prolific'
  | 'first-vote' | 'perfect-voter'
  | 'first-event' | 'social' | 'all-rounder'
  | 'mvp' | 'officer';

export type BadgeCategory = 'fee' | 'profile' | 'community' | 'voting' | 'event' | 'composite';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
}
