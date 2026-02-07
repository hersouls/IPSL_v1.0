import { useState, useRef } from 'react';
import { Download, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { MONTHS, STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import { fmt } from '../../utils/format';
import { exportFeesExcel } from '../../services/export';
import YearSelect from '../ui/YearSelect';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function FeesPanel() {
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const settings = useSettingsStore(s => s.settings);
  const openFeeModal = useUiStore(s => s.openFeeModal);
  const showToast = useUiStore(s => s.showToast);

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
      showToast('회비관리가 잠금되었습니다');
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
      showToast('회비관리 잠금이 해제되었습니다');
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

  const handleCellClick = (memberId: string, mi: number) => {
    if (!unlocked) {
      handleUnlockClick();
      return;
    }
    openFeeModal(memberId, year, mi);
  };

  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const targetYear = parseInt(year);

  let monthsPassed = 12;
  if (targetYear > currentYear) monthsPassed = 0;
  else if (targetYear === currentYear) monthsPassed = currentMonth + 1;

  const totalExpectedAmt = members.length * monthsPassed * settings.monthlyFee;
  let totalPaidAmt = 0;
  members.forEach(m => {
    for (let mo = 0; mo < 12; mo++) {
      const amt = fees[year]?.[m.id]?.[mo] || 0;
      if (amt > 0) totalPaidAmt += amt;
    }
  });
  const unpaidAmt = totalExpectedAmt - totalPaidAmt;
  const rate = totalExpectedAmt > 0 ? Math.round(totalPaidAmt / totalExpectedAmt * 100) : 0;

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
          <button onClick={() => exportFeesExcel(members, fees, year)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            <Download className="w-3.5 h-3.5" />엑셀
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
            {sortedMembers.map(m => {
              let paidAmt = 0;
              let paidMo = 0;
              return (
                <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-zinc-800 z-10">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className="text-[10px] text-zinc-400 ml-1">{m.cohort || ''}</span>
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
    </main>
  );
}
