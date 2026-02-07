import { useState } from 'react';
import { Plus, Heart, UsersRound, CalendarHeart, GraduationCap, Pencil, Trash2, MapPin, User, Users } from 'lucide-react';
import { useEventStore } from '../../stores/eventStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useMemberStore } from '../../stores/memberStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { SUPPORT_CATS } from '../../constants';
import { fmt } from '../../utils/format';
import { getCatBudget } from '../../utils/budget';
import type { SupportCategoryKey } from '../../types';
import YearSelect from '../ui/YearSelect';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';

const CAT_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className="w-3.5 h-3.5" />,
  'users-round': <UsersRound className="w-3.5 h-3.5" />,
  'calendar-heart': <CalendarHeart className="w-3.5 h-3.5" />,
  'graduation-cap': <GraduationCap className="w-3.5 h-3.5" />,
};

const CAT_ICONS_SM: Record<string, React.ReactNode> = {
  heart: <Heart className="w-4 h-4" />,
  'users-round': <UsersRound className="w-4 h-4" />,
  'calendar-heart': <CalendarHeart className="w-4 h-4" />,
  'graduation-cap': <GraduationCap className="w-4 h-4" />,
};

export default function SupportPanel() {
  const events = useEventStore(s => s.events);
  const deleteEvent = useEventStore(s => s.deleteEvent);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const transactions = useTransactionStore(s => s.transactions);
  const members = useMemberStore(s => s.members);
  const settings = useSettingsStore(s => s.settings);
  const { openEventModal, showToast } = useUiStore();

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [currentCat, setCurrentCat] = useState<SupportCategoryKey>('condolence');

  const catInfo = SUPPORT_CATS[currentCat];
  const catEvents = events
    .filter(ev => ev.category === currentCat && ev.date?.startsWith(year))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = catEvents.reduce((s, ev) => s + ev.amount, 0);
  const budget = getCatBudget(currentCat, settings);
  const usageRate = budget > 0 ? Math.round(totalAmount / budget * 100) : 0;

  const handleDelete = (evId: string) => {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    if (!confirm((ev.title || '이 내역') + '을(를) 삭제하시겠습니까?\n연결된 거래내역도 함께 삭제됩니다.')) return;
    if (ev.txId) {
      const tx = transactions.find(t => t.id === ev.txId);
      if (tx) deleteTransaction(tx.id);
    }
    deleteEvent(evId);
    showToast('지원 내역이 삭제되었습니다');
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold">지원관리</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => openEventModal()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />등록
          </button>
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {(Object.entries(SUPPORT_CATS) as [SupportCategoryKey, typeof SUPPORT_CATS[SupportCategoryKey]][]).map(([key, cat]) => {
          const active = key === currentCat;
          return (
            <button
              key={key}
              onClick={() => setCurrentCat(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400 border-2 border-navy-300 dark:border-navy-700'
                  : 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              {CAT_ICONS[cat.icon]}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="건수" value={String(catEvents.length)} unit="건" />
        <SummaryCard label="총 지원액" value={fmt(totalAmount)} unit="원" />
        <SummaryCard label="예산" value={fmt(budget)} unit="원" />
        <SummaryCard
          label="사용률"
          value={String(usageRate)}
          unit="%"
          colorClass={usageRate > 100 ? 'text-red-600 dark:text-red-400' : usageRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
        />
      </div>

      {/* Event list */}
      {catEvents.length === 0 ? (
        <EmptyState message="등록된 지원 내역이 없습니다." />
      ) : (
        <div className="space-y-3">
          {catEvents.map(ev => {
            const member = ev.targetMember ? members.find(m => m.id === ev.targetMember) : null;
            const participantNames = (ev.participants || []).map(pid => {
              const pm = members.find(m => m.id === pid);
              return pm ? pm.name : '(삭제됨)';
            });

            return (
              <div key={ev.id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 relative overflow-hidden card-hover animate-fade-in">
                <div className="accent-bar" style={{ background: 'linear-gradient(90deg, #4338ca, #818cf8)' }} />
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                      {CAT_ICONS_SM[catInfo.icon]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                          {catInfo.label}
                        </span>
                        <span className="text-[11px] text-zinc-400">{ev.date}</span>
                      </div>
                      <p className="text-sm font-bold mt-1">{ev.title || '(제목 없음)'}</p>
                      {ev.location && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3 h-3" />{ev.location}
                        </p>
                      )}
                      {ev.category === 'condolence' && member && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                          <User className="w-3 h-3" />대상: {member.name}{member.cohort ? ` (${member.cohort})` : ''}
                        </p>
                      )}
                      {(ev.category === 'smallGathering' || ev.category === 'annualEvent') && participantNames.length > 0 && (
                        <>
                          <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                            <Users className="w-3 h-3" />참석자: {participantNames.join(', ')} ({participantNames.length}명)
                          </p>
                          {ev.category === 'smallGathering' && participantNames.length > 0 && (
                            <p className="text-[11px] text-zinc-400 ml-[18px]">
                              {participantNames.length}명 x {fmt(settings.smallGathering)}원 = {fmt(participantNames.length * settings.smallGathering)}원
                            </p>
                          )}
                        </>
                      )}
                      {ev.memo && <p className="text-xs text-zinc-400 mt-1">{ev.memo}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="tabular-nums text-sm font-bold text-navy-600 dark:text-navy-400">{fmt(ev.amount)}원</p>
                    <div className="flex gap-1 mt-2 justify-end">
                      <button onClick={() => openEventModal(ev.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="수정">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="삭제">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
