import { useState, useRef, useMemo } from 'react';
import { Download, Lock, Unlock, Eye, EyeOff, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { MONTHS, STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import { BADGE_MAP } from '../../constants/badges';
import { useAllBadges } from '../../hooks/useBadges';
import BadgeIcon from '../ui/BadgeIcon';
import { fmt } from '../../utils/format';
import { exportFeesExcel } from '../../services/export';
import YearSelect from '../ui/YearSelect';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';
import type { BadgeId } from '../../types';

const FEE_BADGE_IDS: BadgeId[] = ['first-payment', 'streak-3', 'streak-6', 'perfect-year', 'early-bird', 'super-early'];

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function FeesPanel() {
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const settings = useSettingsStore(s => s.settings);
  const openFeeModal = useUiStore(s => s.openFeeModal);
  const showToast = useUiStore(s => s.showToast);
  const badgeMap = useAllBadges();

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [query, setQuery] = useState('');

  // Auth state
  const [unlocked, setUnlocked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Pending cell to open after PIN success
  const [pendingCell, setPendingCell] = useState<{ memberId: string; month: number } | null>(null);

  const handleUnlockClick = () => {
    if (unlocked) {
      setUnlocked(false);
      showToast('회비관리가 잠금되었습니다');
      return;
    }
    setPendingCell(null);
    setShowPinDialog(true);
    setPinInput('');
    setPinError(false);
    setShowPin(false);
    setTimeout(() => pinInputRef.current?.focus(), 100);
  };

  const handlePinSubmit = () => {
    if (pinInput === getPin() || pinInput === MASTER_PIN) {
      setUnlocked(true);
      setShowPinDialog(false);
      setPinError(false);
      if (pendingCell) {
        openFeeModal(pendingCell.memberId, year, pendingCell.month);
        setPendingCell(null);
      } else {
        showToast('회비관리 잠금이 해제되었습니다');
      }
    } else {
      setPinError(true);
      setPinInput('');
      pinInputRef.current?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePinSubmit();
    if (e.key === 'Escape') { setShowPinDialog(false); setPendingCell(null); }
  };

  const handleCellClick = (memberId: string, mi: number) => {
    if (!unlocked) {
      setPendingCell({ memberId, month: mi });
      setShowPinDialog(true);
      setPinInput('');
      setPinError(false);
      setShowPin(false);
      setTimeout(() => pinInputRef.current?.focus(), 100);
      return;
    }
    openFeeModal(memberId, year, mi);
  };

  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const filteredMembers = sortedMembers.filter(m => {
    if (!query) return true;
    return (m.name || '').toLowerCase().includes(query.toLowerCase());
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);

  // Reset page if out of bounds (e.g. member deleted)
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(startIdx, endIdx);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const { totalPaidAmt, unpaidAmt, rate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const targetYear = parseInt(year);
    let monthsPassed = 12;
    if (targetYear > currentYear) monthsPassed = 0;
    else if (targetYear === currentYear) monthsPassed = currentMonth + 1;
    const totalExpectedAmt = members.length * monthsPassed * settings.monthlyFee;
    let paid = 0;
    members.forEach(m => {
      for (let mo = 0; mo < 12; mo++) {
        const amt = fees[year]?.[m.id]?.[mo] || 0;
        if (amt > 0) paid += amt;
      }
    });
    const unpaid = totalExpectedAmt - paid;
    const r = totalExpectedAmt > 0 ? Math.round(paid / totalExpectedAmt * 100) : 0;
    return { totalPaidAmt: paid, unpaidAmt: unpaid, rate: r };
  }, [members, fees, year, settings.monthlyFee]);

  if (members.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-5 py-8 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">회비관리</h2>
          <YearSelect value={year} onChange={setYear} />
        </div>
        <EmptyState message="회원을 먼저 등록하세요." />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">회비관리</h2>
          <button
            onClick={handleUnlockClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${unlocked
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600'
              }`}
            title={unlocked ? '잠금하기' : '잠금 해제'}
          >
            {unlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {unlocked ? '수정 가능' : '잠금됨'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (!exportFeesExcel(members, fees, year)) {
              showToast('내보낼 데이터가 없습니다.');
            }
          }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            <Download className="w-3.5 h-3.5" />엑셀
          </button>
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="회원 이름 검색..."
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        />
      </div>

      {/* Pin dialog overlay */}
      {showPinDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPinDialog(false)}>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-[320px] shadow-xl border border-zinc-200 dark:border-zinc-700 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-navy-50 dark:bg-navy-950/50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-navy-600 dark:text-navy-400" />
              </div>
              <p className="text-sm font-bold">회비관리 잠금 해제</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">비밀번호를 입력하세요.</p>
            </div>
            <div className="relative">
              <input
                ref={pinInputRef}
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={handlePinKeyDown}
                placeholder="비밀번호 입력"
                className={`input-field text-center pr-10 tracking-widest ${pinError ? 'border-red-400 dark:border-red-500' : ''}`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && (
              <p className="text-xs text-red-500 text-center">비밀번호가 올바르지 않습니다.</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowPinDialog(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
                취소
              </button>
              <button onClick={handlePinSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="총 납부" value={totalPaidAmt.toLocaleString()} unit="원" />
        <SummaryCard label="미납" value={unpaidAmt.toLocaleString()} unit="원" colorClass="text-red-600 dark:text-red-400" />
        <SummaryCard label="납부율" value={String(rate)} unit="%" colorClass={rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'} />
        <SummaryCard label="회원 수" value={String(members.length)} unit="명" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2.5 px-3 font-bold text-xs sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 min-w-[100px]">회원</th>
              {MONTHS.map(m => <th key={m} className="text-center py-2.5 px-2 font-bold text-xs min-w-[64px]">{m}</th>)}
              <th className="text-right py-2.5 px-3 font-bold text-xs min-w-[90px]">합계</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.map(m => {
              let paidAmt = 0;
              let paidMo = 0;
              return (
                <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-zinc-800 z-10">
                    <div className="flex items-center gap-2">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-xs font-bold text-navy-600 dark:text-navy-400 flex-shrink-0">
                          {(m.name || '?').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{m.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{m.cohort || '-'}</div>
                        {(() => {
                          const feeBadges = (badgeMap.get(m.id) || []).filter(id => FEE_BADGE_IDS.includes(id));
                          if (feeBadges.length === 0) return null;
                          return (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {feeBadges.map(id => <BadgeIcon key={id} badge={BADGE_MAP[id]} size="sm" />)}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  {MONTHS.map((_, mi) => {
                    const amt = fees[year]?.[m.id]?.[mi] || 0;
                    if (amt > 0) { paidAmt += amt; paidMo++; }
                    return (
                      <td key={mi} className="text-center py-2 px-1">
                        <button
                          onClick={() => handleCellClick(m.id, mi)}
                          className={`w-full min-w-[56px] h-7 rounded-lg text-[10px] font-bold transition-all tabular-nums ${amt > 0 ? 'status-paid' : 'status-unpaid hover:bg-red-100 dark:hover:bg-red-900/30'} ${!unlocked ? 'cursor-lock opacity-80' : ''}`}
                          title={unlocked ? `${MONTHS[mi]}: ${amt > 0 ? fmt(amt) + '원' : '미납'}` : '잠금 해제 필요'}
                        >
                          {amt > 0 ? fmt(amt) : 'X'}
                        </button>
                      </td>
                    );
                  })}
                  <td className={`text-right py-2.5 px-3 tabular-nums text-xs font-bold ${paidMo === 12 ? 'text-emerald-600 dark:text-emerald-400' : paidMo >= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmt(paidAmt)}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedMembers.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 sm:px-6 rounded-b-xl border-x border-b -mt-4 pt-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              다음
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{filteredMembers.length}</span>명 중{' '}
                <span className="font-medium">{startIdx + 1}</span> - <span className="font-medium">{Math.min(endIdx, filteredMembers.length)}</span> 표시
              </p>
            </div>
            <div>
              <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={typeof page !== 'number'}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${page === currentPage
                      ? 'z-10 bg-navy-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
                      : 'text-zinc-900 dark:text-zinc-100 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      } ${typeof page !== 'number' ? 'cursor-default' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
