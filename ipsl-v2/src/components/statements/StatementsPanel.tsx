import { useState, useRef, useMemo } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, Printer, BarChart3, Lock, Eye, EyeOff, Link2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Pagination from '../ui/Pagination';
import { useTransactionStore } from '../../stores/transactionStore';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { MONTHS, SUPPORT_CATS, MASTER_PIN } from '../../constants';
import { fmt } from '../../utils/format';
import type { SupportCategoryKey } from '../../types';
import YearSelect from '../ui/YearSelect';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';

export default function StatementsPanel() {
  const transactions = useTransactionStore(s => s.transactions);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const settings = useSettingsStore(s => s.settings);
  const { openTxModal, showToast, openConfirmModal } = useUiStore();

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [query, setQuery] = useState('');
  const [txPage, setTxPage] = useState(1);
  const TX_ITEMS_PER_PAGE = 10;

  // Per-card PIN dialog (master PIN only)
  const [pinAction, setPinAction] = useState<{ type: 'create' | 'edit' | 'delete'; id?: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  const requestPin = (type: 'create' | 'edit' | 'delete', id?: string) => {
    setPinAction({ type, id });
    setPinInput('');
    setPinError(false);
    setShowPin(false);
    setTimeout(() => pinRef.current?.focus(), 100);
  };

  const handlePinSubmit = () => {
    if (pinInput !== MASTER_PIN) {
      setPinError(true);
      setPinInput('');
      pinRef.current?.focus();
      return;
    }
    if (!pinAction) return;

    if (pinAction.type === 'create') {
      openTxModal();
    } else if (pinAction.type === 'edit' && pinAction.id) {
      openTxModal(pinAction.id);
    } else if (pinAction.type === 'delete' && pinAction.id) {
      const tx = transactions.find(t => t.id === pinAction.id);
      const warnings: string[] = [];
      if (tx?.feeRef) warnings.push('연결된 회비 납부 기록도 함께 삭제됩니다.');
      if (tx?.eventId) warnings.push('연결된 지원 내역도 함께 삭제됩니다.');
      const descriptionText = '이 내역을 삭제하시겠습니까?' + (warnings.length ? '\n\n' + warnings.join('\n') : '');

      setPinAction(null);
      openConfirmModal({
        title: '내역 삭제',
        description: descriptionText,
        confirmLabel: '삭제',
        confirmColor: 'red',
        onConfirm: () => {
          deleteTransaction(pinAction.id!);
          showToast('내역이 삭제되었습니다');
        }
      });
      return;
    }
    setPinAction(null);
  };

  // Per-member fee summary (총 입금 = 회비관리 납부 합산)
  const { totalPaidAmt, totalExpectedAmt, rate } = useMemo(() => {
    let paid = 0;
    const expected = members.length * 12 * settings.monthlyFee;
    members.forEach(m => {
      for (let i = 0; i < 12; i++) {
        const a = fees[year]?.[m.id]?.[i] || 0;
        if (a > 0) paid += a;
      }
    });
    const r = expected > 0 ? Math.round(paid / expected * 100) : 0;
    return { totalPaidAmt: paid, totalExpectedAmt: expected, rate: r };
  }, [members, fees, year, settings.monthlyFee]);

  // Transaction ledger
  const yearTx = useMemo(() =>
    transactions
      .filter(tx => tx.date?.startsWith(year))
      .filter(tx => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (tx.description || '').toLowerCase().includes(q) ||
          (tx.category || '').toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, year, query]
  );
  const txDeposits = yearTx.filter(t => t.type === 'deposit' && !t.feeRef).reduce((s, t) => s + t.amount, 0);
  const totalDeposits = totalPaidAmt + txDeposits;
  const totalExpenses = yearTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalDeposits - totalExpenses;

  // Pagination for Transactions
  const totalTx = yearTx.length;
  const totalTxPages = Math.ceil(totalTx / TX_ITEMS_PER_PAGE);
  if (txPage > totalTxPages && totalTxPages > 0) setTxPage(totalTxPages);

  const paginatedTx = yearTx.slice(
    (txPage - 1) * TX_ITEMS_PER_PAGE,
    txPage * TX_ITEMS_PER_PAGE
  );

  // Pagination & Sorting for Summary
  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE);

  // Reset page if out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedMembers = sortedMembers.slice(startIdx, endIdx);

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

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold">회비 내역서</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            <Printer className="w-3.5 h-3.5" />인쇄
          </button>
          <button
            onClick={() => requestPin('create')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />입출금 등록
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
          placeholder="내역 설명, 카테고리 검색..."
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        />
      </div>

      {/* PIN dialog */}
      {pinAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPinAction(null)}>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-50 dark:bg-navy-950/50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-navy-600 dark:text-navy-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">관리자 비밀번호를 입력하세요</p>
            </div>
            <div className="relative mb-3">
              <input
                ref={pinRef}
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
                className={`input-field text-center pr-10 tracking-widest ${pinError ? 'border-red-400 dark:border-red-500' : ''}`}
                placeholder="비밀번호"
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && <p className="text-xs text-red-500 text-center mb-3">비밀번호가 올바르지 않습니다.</p>}
            <button onClick={handlePinSubmit} className="w-full py-2.5 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
              확인
            </button>
          </div>
        </div>
      )}

      {/* Transaction summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="총 입금" value={totalDeposits.toLocaleString()} unit="원" />
        <SummaryCard label="총 사용" value={totalExpenses.toLocaleString()} unit="원" />
        <SummaryCard
          label="잔액"
          value={balance.toLocaleString()}
          unit="원"
          colorClass={balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      {/* Transaction list */}
      {yearTx.length === 0 ? (
        <EmptyState message="등록된 입출금 내역이 없습니다." />
      ) : (
        <div className="space-y-2">
          {paginatedTx.map(tx => {
            const isDeposit = tx.type === 'deposit';
            const catInfo = tx.category ? SUPPORT_CATS[tx.category as SupportCategoryKey] : null;
            return (
              <div key={tx.id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                    {isDeposit ? <ArrowDownCircle className="w-4.5 h-4.5" /> : <ArrowUpCircle className="w-4.5 h-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                        {isDeposit ? '입금' : '사용'}
                      </span>
                      {catInfo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                          {catInfo.label}
                        </span>
                      )}
                      {(tx.feeRef || tx.eventId) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title={tx.feeRef ? '회비 연결' : '지원 연결'}>
                          <Link2 className="w-2.5 h-2.5" />{tx.feeRef ? '회비' : '지원'}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400">{tx.date}</span>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{tx.description || '(설명 없음)'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="tabular-nums text-sm font-bold text-navy-600 dark:text-navy-400">
                    {isDeposit ? '+' : '-'}{tx.amount.toLocaleString()}원
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => requestPin('edit', tx.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="수정">
                      <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button onClick={() => requestPin('delete', tx.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="삭제">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        totalItems={totalTx}
        itemsPerPage={TX_ITEMS_PER_PAGE}
        currentPage={txPage}
        onPageChange={setTxPage}
        className="mb-8"
      />

      {/* Per-member fee summary */}
      {members.length > 0 && (
        <>
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 relative overflow-hidden">
            <div className="accent-bar" style={{ background: 'linear-gradient(90deg, #4338ca, #818cf8)' }} />
            <div className="flex items-center gap-2.5 mb-4 pt-1">
              <div className="badge-icon bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="tag bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400">{year}년</span>
                <h3 className="text-lg font-bold mt-0.5">회비 납부 종합</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <MiniCard label="총 예상 수입" value={`${totalExpectedAmt.toLocaleString()}원`} />
              <MiniCard label="실제 수입" value={`${totalPaidAmt.toLocaleString()}원`} colorClass="text-navy-600 dark:text-navy-400" />
              <MiniCard label="미납 금액" value={`${(totalExpectedAmt - totalPaidAmt).toLocaleString()}원`} colorClass="text-red-600 dark:text-red-400" />
              <MiniCard
                label="전체 납부율"
                value={`${rate}%`}
                colorClass={rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
              />
            </div>
            <div className="budget-bar mb-2">
              <div className="budget-fill bg-navy-500" style={{ width: `${rate}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500 text-right">{totalPaidAmt.toLocaleString()} / {totalExpectedAmt.toLocaleString()} 원</p>
          </div>

          {/* Individual member cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedMembers.map(m => {
              let paidAmt = 0;
              let paidMo = 0;
              return (
                <div key={m.id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-xs font-bold text-navy-600 dark:text-navy-400">
                          {(m.name || '?').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-[10px] text-zinc-500">{m.cohort || '-'}</p>
                      </div>
                    </div>
                    <span className={`tabular-nums text-sm font-bold ${paidMo === 12 ? 'text-emerald-600 dark:text-emerald-400' : paidMo >= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(() => {
                        MONTHS.forEach((_, mi) => {
                          const amt = fees[year]?.[m.id]?.[mi] || 0;
                          if (amt > 0) { paidAmt += amt; paidMo++; }
                        });
                        return `${paidMo}/12`;
                      })()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {MONTHS.map((mn, mi) => {
                      const amt = fees[year]?.[m.id]?.[mi] || 0;
                      return (
                        <span
                          key={mi}
                          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1 rounded-md text-[10px] font-bold tabular-nums ${amt > 0 ? 'status-paid' : 'status-unpaid'}`}
                          title={`${mn}: ${amt > 0 ? fmt(amt) + '원' : '미납'}`}
                        >
                          {amt > 0 ? fmt(amt) : 'X'}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                    <span>납부: {paidAmt.toLocaleString()}원</span>
                    <span>미납: {(12 * settings.monthlyFee - paidAmt).toLocaleString()}원</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {sortedMembers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 sm:px-6 rounded-xl">
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
                    <span className="font-medium">{sortedMembers.length}</span>명 중{' '}
                    <span className="font-medium">{startIdx + 1}</span> - <span className="font-medium">{Math.min(endIdx, sortedMembers.length)}</span> 표시
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
        </>
      )}
    </main>
  );
}

function MiniCard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50 text-center">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={`tabular-nums text-base font-extrabold mt-0.5 ${colorClass || ''}`}>{value}</p>
    </div>
  );
}
