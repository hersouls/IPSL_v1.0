import { ScrollText } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUiStore } from '../../stores/uiStore';
import { fmtMan } from '../../utils/format';

export default function Header() {
  const settings = useSettingsStore(s => s.settings);
  const members = useMemberStore(s => s.members);
  const fees = useFeeStore(s => s.fees);
  const transactions = useTransactionStore(s => s.transactions);
  const switchTab = useUiStore(s => s.switchTab);

  const year = new Date().getFullYear();
  const yearStr = String(year);

  const expense = transactions
    .filter(t => t.type === 'expense' && t.date?.startsWith(yearStr))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const memCount = members.length;

  let income = 0;
  if (fees[yearStr]) {
    Object.values(fees[yearStr]).forEach(mFees => {
      income += Object.values(mFees).reduce((s, v) => s + (v || 0), 0);
    });
  }

  let unpaid = 0;
  const currentMonth = new Date().getMonth();
  members.forEach(m => {
    const mFees = fees[yearStr]?.[m.id] || {};
    for (let i = 0; i <= currentMonth; i++) {
      const paid = mFees[i] || 0;
      if (paid < settings.monthlyFee) unpaid += (settings.monthlyFee - paid);
    }
  });

  const stats = [
    { value: fmtMan(expense), unit: '만 원', label: '연간 총 집행금액', tab: 'statements' as const },
    { value: String(memCount), unit: '명', label: '등록 회원수', tab: 'members' as const },
    { value: fmtMan(income), unit: '만 원', label: '연간 납부회비 총액', tab: 'fees' as const },
    { value: fmtMan(unpaid), unit: '만 원', label: '미납 회비 총액', tab: 'fees' as const },
  ];

  return (
    <header className="hero-bg text-white no-print">
      <div className="relative z-10 max-w-4xl mx-auto px-5 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <ScrollText className="w-[18px] h-[18px] text-navy-300" />
          </div>
          <a
            href="https://sites.google.com/view/powerinha/home?authuser=0"
            target="_blank"
            rel="noopener noreferrer"
            className="tag bg-white/10 text-navy-200 border border-white/10 hover:bg-white/20 transition-colors"
          >
            IPSL Alumni
          </a>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
          IPSL 대학원 졸업생 모임<br />
          <span className="text-navy-300">회칙 및 운영 관리 시스템</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mt-3">
          회원 관리, 회비 운영, 내역 관리를 위한 통합 플랫폼입니다. 투명한 운영과 지속 가능한 친목 도모를 목적으로 합니다.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
          {stats.map((s, i) => (
            <div
              key={i}
              onClick={() => switchTab(s.tab)}
              className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-center cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="tabular-nums text-xl font-extrabold text-white">
                {s.value}
                <span className="text-xs font-semibold text-slate-400 ml-0.5">{s.unit}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
