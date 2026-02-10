import { useMemo, useCallback, useState } from 'react';
import { useAnnouncementStore } from '../stores/announcementStore';
import { useScheduleStore } from '../stores/scheduleStore';
import { useVotingStore } from '../stores/votingStore';
import { useMemberStore } from '../stores/memberStore';
import { useFeeStore } from '../stores/feeStore';
import { STORAGE_KEYS } from '../constants';
import type { TabId } from '../types';

export type NotificationType = 'announcement' | 'schedule' | 'vote' | 'birthday' | 'fee';

export interface NotificationItem {
  type: NotificationType;
  title: string;
  description: string;
  tab: TabId;
  timestamp: string;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toMMDD(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useNotifications() {
  const announcements = useAnnouncementStore(s => s.announcements);
  const schedules = useScheduleStore(s => s.schedules);
  const sessions = useVotingStore(s => s.sessions);
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);

  // trigger re-render when markAsRead is called
  const [, setTick] = useState(0);

  const notifications = useMemo(() => {
    const items: NotificationItem[] = [];
    const now = new Date();
    const todayStr = toYMD(now);
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = toYMD(tomorrow);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const todayMMDD = toMMDD(now);
    const yearStr = String(now.getFullYear());
    const currentMonth = now.getMonth();

    // 1. New Announcements (last 7 days)
    announcements
      .filter(a => new Date(a.createdAt) >= sevenDaysAgo)
      .forEach(a => {
        items.push({
          type: 'announcement',
          title: '새 공지',
          description: a.title,
          tab: 'announcements',
          timestamp: a.createdAt,
        });
      });

    // 2. Today/Tomorrow Schedules
    schedules
      .filter(s => s.date === todayStr || s.date === tomorrowStr)
      .forEach(s => {
        const isToday = s.date === todayStr;
        items.push({
          type: 'schedule',
          title: isToday ? '오늘 일정' : '내일 일정',
          description: `${s.title}${s.location ? ' @ ' + s.location : ''}`,
          tab: 'calendar',
          timestamp: s.createdAt,
        });
      });

    // 3. Open Votes
    sessions
      .filter(s => s.status === 'open')
      .forEach(s => {
        items.push({
          type: 'vote',
          title: '진행중 투표',
          description: s.title,
          tab: 'voting',
          timestamp: s.createdAt,
        });
      });

    // 4. Birthdays Today (MM-DD match)
    members
      .filter(m => {
        if (!m.birthday) return false;
        return m.birthday.slice(5) === todayMMDD;
      })
      .forEach(m => {
        items.push({
          type: 'birthday',
          title: '오늘 생일',
          description: `${m.name}님의 생일입니다`,
          tab: 'members',
          timestamp: now.toISOString(),
        });
      });

    // 5. Unpaid Fees (current month)
    const unpaidMembers = members.filter(m => {
      const paid = fees[yearStr]?.[m.id]?.[currentMonth] ?? 0;
      return paid === 0;
    });
    if (unpaidMembers.length > 0) {
      items.push({
        type: 'fee',
        title: '미납 회비',
        description: `${currentMonth + 1}월 미납 ${unpaidMembers.length}명`,
        tab: 'fees',
        timestamp: now.toISOString(),
      });
    }

    return items;
  }, [announcements, schedules, sessions, members, fees]);

  const unreadCount = useMemo(() => {
    const lastChecked = localStorage.getItem(STORAGE_KEYS.lastCheckedAt);
    if (!lastChecked) return notifications.length;

    const lastCheckedDate = new Date(lastChecked);
    const lastCheckedDay = lastCheckedDate.toDateString();
    const todayDay = new Date().toDateString();

    return notifications.filter(n => {
      // Birthday and fee are daily ephemeral - unread if lastChecked is not today
      if (n.type === 'birthday' || n.type === 'fee') {
        return lastCheckedDay !== todayDay;
      }
      return new Date(n.timestamp) > lastCheckedDate;
    }).length;
  }, [notifications]);

  const markAsRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.lastCheckedAt, new Date().toISOString());
    setTick(t => t + 1);
  }, []);

  return { notifications, unreadCount, markAsRead };
}
