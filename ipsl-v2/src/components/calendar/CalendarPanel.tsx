import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Cake, ArrowDownCircle, ArrowUpCircle, CalendarHeart, Receipt, Clock, Plus, MapPin, Pencil } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useEventStore } from '../../stores/eventStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { SUPPORT_CATS, SCHEDULE_LABELS } from '../../constants';
import { getHoliday } from '../../utils/holidays';
import { fmt } from '../../utils/format';
import SummaryCard from '../ui/SummaryCard';
import type { SupportCategoryKey, Transaction, Event as IEvent, Member, Schedule } from '../../types';

const DOW_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPanel() {
  const { calYear, calMonth, calSelectedDate, calPrevMonth, calNextMonth, calGoToday, calSelectDate } = useUiStore();
  const openScheduleModal = useUiStore(s => s.openScheduleModal);
  const transactions = useTransactionStore(s => s.transactions);
  const events = useEventStore(s => s.events);
  const schedules = useScheduleStore(s => s.schedules);
  const members = useMemberStore(s => s.members);

  const mm = String(calMonth + 1).padStart(2, '0');
  const prefix = `${calYear}-${mm}`;

  // Gather calendar data with useMemo
  const { birthdays, txByDay, eventsByDay, schedulesByDay } = useMemo(() => {
    const _birthdays: Record<string, string[]> = {};
    members.forEach(m => {
      if (!m.birthday) return;
      const bmd = m.birthday.slice(5);
      if (bmd.startsWith(mm + '-')) {
        const day = String(parseInt(bmd.slice(3), 10));
        if (!_birthdays[day]) _birthdays[day] = [];
        _birthdays[day].push(m.name);
      }
    });

    const _txByDay: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      if (!tx.date || !tx.date.startsWith(prefix)) return;
      const day = String(parseInt(tx.date.slice(8), 10));
      if (!_txByDay[day]) _txByDay[day] = [];
      _txByDay[day].push(tx);
    });

    const _eventsByDay: Record<string, IEvent[]> = {};
    events.forEach(ev => {
      if (!ev.date || !ev.date.startsWith(prefix)) return;
      const day = String(parseInt(ev.date.slice(8), 10));
      if (!_eventsByDay[day]) _eventsByDay[day] = [];
      _eventsByDay[day].push(ev);
    });

    const _schedulesByDay: Record<string, Schedule[]> = {};
    schedules.forEach(sc => {
      if (!sc.date || !sc.date.startsWith(prefix)) return;
      const day = String(parseInt(sc.date.slice(8), 10));
      if (!_schedulesByDay[day]) _schedulesByDay[day] = [];
      _schedulesByDay[day].push(sc);
    });

    return { birthdays: _birthdays, txByDay: _txByDay, eventsByDay: _eventsByDay, schedulesByDay: _schedulesByDay };
  }, [members, transactions, events, schedules, calYear, calMonth, mm, prefix]);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let hasAnyEvent = false;

  // Monthly summary
  const allTx = transactions.filter(tx => tx.date?.startsWith(prefix));
  const deposits = allTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const expenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bCount = Object.values(birthdays).flat().length;
  const scCount = schedules.filter(sc => sc.date?.startsWith(prefix)).length;

  // Build grid cells
  const cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[96px] border-b border-r border-zinc-100 dark:border-zinc-700/50 p-1" />
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayKey = String(d);
    const dateStr = `${calYear}-${mm}-${String(d).padStart(2, '0')}`;
    const dow = (firstDay + d - 1) % 7;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calSelectedDate;
    const hasBirthday = !!(birthdays[dayKey]?.length);
    const hasTx = !!(txByDay[dayKey]?.length);
    const hasEvt = !!(eventsByDay[dayKey]?.length);
    const hasSc = !!(schedulesByDay[dayKey]?.length);

    const holidayName = getHoliday(dateStr);
    const isHoliday = !!holidayName;

    if (hasBirthday || hasTx || hasEvt || hasSc || isHoliday) hasAnyEvent = true;

    let dayColor = 'text-zinc-700 dark:text-zinc-300';
    if (dow === 0 || isHoliday) dayColor = 'text-red-400';
    else if (dow === 6) dayColor = 'text-blue-400';

    const cellBg = isToday ? 'bg-navy-50/60 dark:bg-navy-950/30' : '';
    const ring = isSelected ? 'ring-2 ring-navy-500 ring-inset' : '';

    cells.push(
      <div
        key={d}
        onClick={() => calSelectDate(dateStr)}
        className={`min-h-[72px] sm:min-h-[96px] border-b border-r border-zinc-100 dark:border-zinc-700/50 p-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors ${cellBg} ${ring}`}
      >
        {isToday ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-navy-600 text-white text-xs font-bold mb-0.5">{d}</div>
        ) : (
          <div className={`text-xs font-semibold ${dayColor} mb-0.5 pl-0.5`}>{d}</div>
        )}

        {/* Desktop: text details */}
        {holidayName && (
          <div className="hidden sm:block text-[10px] text-red-500 truncate mb-0.5 font-bold">
            {holidayName}
          </div>
        )}
        {hasBirthday && birthdays[dayKey].map((name, i) => (
          <div key={`b-${i}`} className="hidden sm:flex items-center gap-0.5 text-[10px] text-pink-500 truncate mb-0.5" title={`${name} 생일`}>
            <Cake className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{name}</span>
          </div>
        ))}
        {hasTx && txByDay[dayKey].slice(0, 2).map((tx, i) => {
          const dep = tx.type === 'deposit';
          const cc = dep ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
          return (
            <div key={`t-${i}`} className={`hidden sm:flex items-center gap-0.5 text-[10px] ${cc} truncate mb-0.5`}>
              {dep ? <ArrowDownCircle className="w-2.5 h-2.5 flex-shrink-0" /> : <ArrowUpCircle className="w-2.5 h-2.5 flex-shrink-0" />}
              <span className="truncate">{dep ? '+' : '-'}{fmt(tx.amount)}</span>
            </div>
          );
        })}
        {hasTx && txByDay[dayKey].length > 2 && (
          <div className="hidden sm:block text-[9px] text-zinc-400 pl-0.5">+{txByDay[dayKey].length - 2}건</div>
        )}
        {hasSc && schedulesByDay[dayKey].slice(0, 1).map((sc, i) => (
          <div key={`sc-${i}`} className="hidden sm:flex items-center gap-0.5 text-[10px] text-violet-600 dark:text-violet-400 truncate mb-0.5" title={sc.title}>
            <Clock className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{sc.title}</span>
          </div>
        ))}
        {hasSc && schedulesByDay[dayKey].length > 1 && (
          <div className="hidden sm:block text-[9px] text-violet-400 pl-0.5">+{schedulesByDay[dayKey].length - 1}건</div>
        )}

        {/* Mobile: colored dots */}
        {(hasBirthday || hasTx || hasEvt || hasSc) && (
          <div className="flex sm:hidden items-center gap-0.5 mt-0.5 flex-wrap">
            {isHoliday && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {hasBirthday && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
            {hasTx && txByDay[dayKey].some(t => t.type === 'deposit') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {hasTx && txByDay[dayKey].some(t => t.type === 'expense') && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
            {hasEvt && <span className="w-1.5 h-1.5 rounded-full bg-navy-500" />}
            {hasSc && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
          </div>
        )}
      </div>
    );
  }

  // Fill remaining cells
  const totalCells = firstDay + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push(
        <div key={`pad-${i}`} className="min-h-[72px] sm:min-h-[96px] border-b border-r border-zinc-100 dark:border-zinc-700/50 p-1" />
      );
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold">캘린더</h2>
        <div className="flex items-center gap-2">
          <button onClick={calPrevMonth} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold min-w-[100px] text-center">{calYear}년 {calMonth + 1}월</span>
          <button onClick={calNextMonth} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={calGoToday} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
            오늘
          </button>
          <button
            onClick={() => openScheduleModal(null, calSelectedDate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3 h-3" />새 일정
          </button>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="이 달 생일" value={String(bCount)} unit="명" colorClass="text-pink-500" />
        <SummaryCard label="입금" value={fmt(deposits)} unit="원" colorClass="text-emerald-600 dark:text-emerald-400" />
        <SummaryCard label="출금" value={fmt(expenses)} unit="원" colorClass="text-red-500 dark:text-red-400" />
        <SummaryCard label="일정" value={String(scCount)} unit="건" colorClass="text-violet-600 dark:text-violet-400" />
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7">
          {DOW_NAMES.map((name, i) => (
            <div
              key={name}
              className={`text-center text-xs font-bold py-2 border-b border-r border-zinc-200 dark:border-zinc-700 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-500'
                }`}
            >
              {name}
            </div>
          ))}
          {cells}
        </div>
      </div>

      {!hasAnyEvent && !calSelectedDate && <EmptyState />}

      {/* Selected date detail */}
      {calSelectedDate && (
        <CalendarDetail
          dateStr={calSelectedDate}
          members={members}
          transactions={transactions}
          events={events}
          schedules={schedules}
          openScheduleModal={openScheduleModal}
        />
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-sm">
      이번 달 일정이 없습니다.
    </div>
  );
}

function CalendarDetail({ dateStr, members, transactions, events, schedules, openScheduleModal }: {
  dateStr: string;
  members: Member[];
  transactions: Transaction[];
  events: IEvent[];
  schedules: Schedule[];
  openScheduleModal: (id?: string | null, date?: string | null) => void;
}) {
  const day = parseInt(dateStr.slice(8), 10);
  const mm = dateStr.slice(5, 7);
  const month = parseInt(mm, 10);
  const year = parseInt(dateStr.slice(0, 4), 10);
  const dateDisplay = `${year}년 ${month}월 ${day}일`;
  const dowDisplay = DOW_NAMES[new Date(year, month - 1, day).getDay()] + '요일';
  const holidayName = getHoliday(dateStr);

  const dayBirthdays = members.filter(m => m.birthday && m.birthday.slice(5) === `${mm}-${String(day).padStart(2, '0')}`);
  const dayTx = transactions.filter(tx => tx.date === dateStr);
  const dayEvents = events.filter(ev => ev.date === dateStr);
  const daySchedules = schedules.filter(sc => sc.date === dateStr);

  const isEmpty = !holidayName && dayBirthdays.length === 0 && dayTx.length === 0 && dayEvents.length === 0 && daySchedules.length === 0;

  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-navy-500" />
          {dateDisplay} ({dowDisplay})
          {holidayName && <span className="text-red-500 ml-1">[{holidayName}]</span>}
        </h3>
        <button
          onClick={() => openScheduleModal(null, dateStr)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
        >
          <Plus className="w-3 h-3" />일정 추가
        </button>
      </div>

      {isEmpty && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-3">이 날에 등록된 일정이 없습니다.</p>
          <button
            onClick={() => openScheduleModal(null, dateStr)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />일정을 추가하세요
          </button>
        </div>
      )}

      {dayBirthdays.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-bold text-pink-500 mb-1.5 flex items-center gap-1"><Cake className="w-3 h-3" />생일</p>
          {dayBirthdays.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-pink-50 dark:bg-pink-950/20 mb-1">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xs font-bold text-pink-600 dark:text-pink-400">
                  {(m.name || '?').charAt(0)}
                </div>
              )}
              <div>
                <span className="text-xs font-semibold">{m.name}</span>
                <span className="text-[10px] text-zinc-400 ml-1">{m.cohort || ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {dayTx.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1"><Receipt className="w-3 h-3" />입출금 내역</p>
          {dayTx.map(tx => {
            const dep = tx.type === 'deposit';
            const bg = dep ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20';
            const tc = dep ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
            const catInfo = tx.category ? SUPPORT_CATS[tx.category as SupportCategoryKey] : null;
            return (
              <div key={tx.id} className={`flex items-center justify-between py-2 px-2 rounded-lg ${bg} mb-1`}>
                <div className="flex items-center gap-2 min-w-0">
                  {dep ? <ArrowDownCircle className={`w-4 h-4 ${tc} flex-shrink-0`} /> : <ArrowUpCircle className={`w-4 h-4 ${tc} flex-shrink-0`} />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${bg} ${tc}`}>{dep ? '입금' : '사용'}</span>
                      {catInfo && (
                        <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">{catInfo.label}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate mt-0.5">{tx.description || '(설명 없음)'}</p>
                  </div>
                </div>
                <span className={`tabular-nums text-sm font-bold ${tc} flex-shrink-0 ml-2`}>
                  {dep ? '+' : '-'}{fmt(tx.amount)}원
                </span>
              </div>
            );
          })}
        </div>
      )}

      {dayEvents.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1"><CalendarHeart className="w-3 h-3" />행사</p>
          {dayEvents.map(ev => {
            const cat = SUPPORT_CATS[ev.category as SupportCategoryKey] || { label: ev.category || '기타', icon: 'calendar', color: 'navy' };
            return (
              <div key={ev.id} className="flex items-center justify-between py-2 px-2 rounded-lg bg-navy-50 dark:bg-navy-950/20 mb-1">
                <div className="flex items-center gap-2">
                  <CalendarHeart className="w-4 h-4 text-navy-500" />
                  <div>
                    <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">{cat.label}</span>
                    <p className="text-xs font-medium mt-0.5">{ev.title || ''}</p>
                  </div>
                </div>
                <span className="tabular-nums text-sm font-bold text-navy-600 dark:text-navy-400">{fmt(ev.amount || 0)}원</span>
              </div>
            );
          })}
        </div>
      )}

      {daySchedules.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />일정</p>
          {daySchedules.map(sc => {
            const labelInfo = SCHEDULE_LABELS[sc.scheduleLabel] || SCHEDULE_LABELS.custom;
            const timeStr = sc.startTime ? (sc.endTime ? `${sc.startTime} - ${sc.endTime}` : sc.startTime) : '';
            return (
              <div
                key={sc.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 mb-1 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                onClick={() => openScheduleModal(sc.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">{labelInfo.label}</span>
                      {timeStr && <span className="text-[10px] text-zinc-400">{timeStr}</span>}
                    </div>
                    <p className="text-xs font-medium truncate mt-0.5">{sc.title}</p>
                    {sc.location && (
                      <p className="text-[10px] text-zinc-400 flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{sc.location}</p>
                    )}
                  </div>
                </div>
                <Pencil className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
