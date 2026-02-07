import { useState, useRef } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, Printer, BarChart3, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { MONTHS, SUPPORT_CATS, STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import { fmt } from '../../utils/format';
import type { SupportCategoryKey } from '../../types';
import YearSelect from '../ui/YearSelect';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function StatementsPanel() {
  const transactions = useTransactionStore(s => s.transactions);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const settings = useSettingsStore(s => s.settings);
  const { openTxModal, showToast } = useUiStore();

  const [year, setYear] = useState(String(new Date().getFullYear()));

  // Auth state
  const [unlocked, setUnlocked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const handleUnlockClick = () => {
    if (unlocked) {
      setUnlocked(false);
      showToast('내역서가 잠금되었습니다');
      return;
    }
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
      showToast('내역서 잠금이 해제되었습니다');
    } else {
      setPinError(true);
      setPinInput('');
      pinInputRef.current?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePinSubmit();
    if (e.key === 'Escape') setShowPinDialog(false);
  };

  const requireUnlock = (action: () => void) => {
    if (!unlocked) {
      handleUnlockClick();
      return;
    }
    action();
  };

  // Per-member fee summary (총 입금 = 회비관리 납부 합산)
  let totalPaidAmt = 0;
  const totalExpectedAmt = members.length * 12 * settings.monthlyFee;
  members.forEach(m => {
    for (let i = 0; i < 12; i++) {
      const a = fees[year]?.[m.id]?.[i] || 0;
      if (a > 0) totalPaidAmt += a;
    }
  });
  const rate = totalExpectedAmt > 0 ? Math.round(totalPaidAmt / totalExpectedAmt * 100) : 0;

  // Transaction ledger
  const yearTx = transactions
    .filter(tx => tx.date?.startsWith(year))
    .sort((a, b) => b.date.localeCompare(a.date));
  const txDeposits = yearTx.filter(t => t.type === 'deposit' && !t.feeRef).reduce((s, t) => s + t.amount, 0);
  const totalDeposits = totalPaidAmt + txDeposits; // 회비 납부(그리드) + 수동 입금(feeRef 제외)
  const totalExpenses = yearTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalDeposits - totalExpenses;

  const handleDelete = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    const hasEvent = tx?.eventId;
    if (!confirm('이 내역을 삭제하시겠습니까?' + (hasEvent ? '\n연결된 지원 내역도 함께 삭제됩니다.' : ''))) return;
    deleteTransaction(id);
    showToast('내역이 삭제되었습니다');
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">회비 내역서</h2>
          <button
            onClick={handleUnlockClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              unlocked
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
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            <Printer className="w-3.5 h-3.5" />인쇄
          </button>
          <button
            onClick={() => requireUnlock(() => openTxModal())}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              unlocked
                ? 'bg-navy-600 text-white hover:bg-navy-700'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-default'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />입출금 등록
          </button>
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      {/* Pin dialog overlay */}
      {showPinDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPinDialog(false)}>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-[320px] shadow-xl border border-zinc-200 dark:border-zinc-700 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-navy-50 dark:bg-navy-950/50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-navy-600 dark:text-navy-400" />
              </div>
              <p className="text-sm font-bold">내역서 잠금 해제</p>
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
          {yearTx.map(tx => {
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
                      <span className="text-[11px] text-zinc-400">{tx.date}</span>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{tx.description || '(설명 없음)'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="tabular-nums text-sm font-bold text-navy-600 dark:text-navy-400">
                    {isDeposit ? '+' : '-'}{tx.amount.toLocaleString()}원
                  </span>
                  {unlocked && (
                    <div className="flex gap-1">
                      <button onClick={() => openTxModal(tx.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="수정">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="삭제">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            {members.map(m => {
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
                      {/* Compute inline */}
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
