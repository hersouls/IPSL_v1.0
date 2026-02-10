import { useMemo } from 'react';
import { useMemberStore } from '../stores/memberStore';
import { useFeeStore } from '../stores/feeStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useEventStore } from '../stores/eventStore';
import { useVotingStore } from '../stores/votingStore';
import { useBoardPostStore } from '../stores/boardPostStore';
import { useAnnouncementStore } from '../stores/announcementStore';
import type { BadgeId, Member, Fees, Transaction, Event, VotingSession, BoardPost, Announcement } from '../types';

// ── helpers ──

/** Find max consecutive run length in a sorted array of sequential numbers */
function maxConsecutive(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  let max = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      cur++;
      if (cur > max) max = cur;
    } else if (sorted[i] !== sorted[i - 1]) {
      cur = 1;
    }
  }
  return max;
}

/** Get all paid sequential month numbers for a member */
function getPaidMonths(fees: Fees, memberId: string): number[] {
  const months: number[] = [];
  for (const year of Object.keys(fees)) {
    const mf = fees[year]?.[memberId];
    if (!mf) continue;
    const y = parseInt(year);
    for (let m = 0; m < 12; m++) {
      if (mf[m] > 0) months.push(y * 12 + m);
    }
  }
  months.sort((a, b) => a - b);
  return months;
}

/** Get early-bird sequential month numbers (paid on or before 10th) */
function getEarlyMonths(fees: Fees, transactions: Transaction[], memberId: string): number[] {
  const months: number[] = [];
  for (const year of Object.keys(fees)) {
    const mf = fees[year]?.[memberId];
    if (!mf) continue;
    const y = parseInt(year);
    for (let m = 0; m < 12; m++) {
      if (mf[m] > 0) {
        const feeRef = `fee_${year}_${memberId}_${m}`;
        const tx = transactions.find(t => t.feeRef === feeRef);
        if (tx) {
          const deadline = new Date(y, m, 10, 23, 59, 59);
          const txDate = new Date(tx.date);
          if (txDate <= deadline) {
            months.push(y * 12 + m);
          }
        }
      }
    }
  }
  months.sort((a, b) => a - b);
  return months;
}

/** Check if any year has all 12 months paid */
function hasPerfectYear(fees: Fees, memberId: string): boolean {
  for (const year of Object.keys(fees)) {
    const mf = fees[year]?.[memberId];
    if (!mf) continue;
    let count = 0;
    for (let m = 0; m < 12; m++) {
      if (mf[m] > 0) count++;
    }
    if (count === 12) return true;
  }
  return false;
}

const BASIC_FIELDS: (keyof Member)[] = ['name', 'degree', 'cohort'];
const COMPLETE_FIELDS: (keyof Member)[] = ['name', 'degree', 'cohort', 'role', 'phone', 'email', 'company', 'birthday'];

function countComments(boardPosts: BoardPost[], announcements: Announcement[], memberName: string): number {
  let count = 0;
  for (const p of boardPosts) {
    if (p.comments) {
      count += p.comments.filter(c => c.author === memberName).length;
    }
  }
  for (const a of announcements) {
    if (a.comments) {
      count += a.comments.filter(c => c.author === memberName).length;
    }
  }
  return count;
}

// ── main computation ──

function computeBadges(
  member: Member,
  fees: Fees,
  transactions: Transaction[],
  events: Event[],
  sessions: VotingSession[],
  boardPosts: BoardPost[],
  announcements: Announcement[],
): BadgeId[] {
  const earned: BadgeId[] = [];
  const mid = member.id;
  const name = member.name;

  // ── Fee badges ──
  const paidMonths = getPaidMonths(fees, mid);
  if (paidMonths.length > 0) earned.push('first-payment');

  const streak = maxConsecutive(paidMonths);
  if (streak >= 3) earned.push('streak-3');
  if (streak >= 6) earned.push('streak-6');
  if (hasPerfectYear(fees, mid)) earned.push('perfect-year');

  const earlyMonths = getEarlyMonths(fees, transactions, mid);
  const earlyStreak = maxConsecutive(earlyMonths);
  if (earlyStreak >= 3) earned.push('early-bird');
  if (earlyStreak >= 6) earned.push('super-early');

  // ── Profile badges ──
  if (BASIC_FIELDS.every(f => (member[f] as string)?.trim())) earned.push('profile-basic');
  if (COMPLETE_FIELDS.every(f => (member[f] as string)?.trim())) earned.push('profile-complete');
  if (member.avatar) earned.push('avatar-set');

  // ── Community badges ──
  const postCount = boardPosts.filter(p => p.author === name).length;
  if (postCount >= 1) earned.push('first-post');
  if (postCount >= 5) earned.push('active-writer');

  const commentCount = countComments(boardPosts, announcements, name);
  if (commentCount >= 1) earned.push('first-comment');

  const announcementCount = announcements.filter(a => a.author === name).length;
  if (announcementCount >= 1) earned.push('announcer');

  if (postCount + announcementCount + commentCount >= 15) earned.push('prolific');

  // ── Voting badges ──
  const closedSessions = sessions.filter(s => s.status === 'closed');
  const votedCount = closedSessions.filter(s =>
    s.votes[mid] && !s.autoApproved?.includes(mid)
  ).length;
  if (votedCount >= 1) earned.push('first-vote');
  if (closedSessions.length > 0 && votedCount === closedSessions.length) earned.push('perfect-voter');

  // ── Event badges ──
  const participated = events.filter(e => e.participants?.includes(mid));
  if (participated.length >= 1) earned.push('first-event');
  if (participated.length >= 5) earned.push('social');
  const cats = new Set(participated.map(e => e.category));
  if (cats.size >= 4) earned.push('all-rounder');

  // ── Composite: MVP ──
  if (
    earned.includes('streak-6') &&
    earned.includes('profile-complete') &&
    earned.includes('first-vote') &&
    earned.includes('first-event')
  ) {
    earned.push('mvp');
  }

  if (
    earned.includes('streak-6') &&
    earned.includes('profile-complete') &&
    earned.includes('first-vote') &&
    earned.includes('first-event')
  ) {
    earned.push('mvp');
  }

  // ── Officer badge ──
  const officerRoles = ['회장', '총무', '감사'];
  if (officerRoles.some(role => member.role?.includes(role))) {
    earned.push('officer');
  }

  return earned;
}

// ── hook ──

export function useAllBadges(): Map<string, BadgeId[]> {
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const transactions = useTransactionStore(s => s.transactions);
  const events = useEventStore(s => s.events);
  const sessions = useVotingStore(s => s.sessions);
  const boardPosts = useBoardPostStore(s => s.boardPosts);
  const announcements = useAnnouncementStore(s => s.announcements);

  return useMemo(() => {
    const result = new Map<string, BadgeId[]>();
    for (const member of members) {
      result.set(
        member.id,
        computeBadges(member, fees, transactions, events, sessions, boardPosts, announcements),
      );
    }
    return result;
  }, [members, fees, transactions, events, sessions, boardPosts, announcements]);
}
