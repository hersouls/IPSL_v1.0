import { useState, useMemo } from 'react';
import {
  List, Users, Wallet, Heart, UsersRound, CalendarHeart, GraduationCap,
  PiggyBank, Eye, FileEdit, Clock, RefreshCw, Crown, Briefcase, ShieldCheck,
  Vote, AlertTriangle, Check, Camera, Info, BarChart3,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { fmt, fmtMan } from '../../utils/format';
import { calcBudget, calcReserve, getCatBudget } from '../../utils/budget';
import { REVISION_HISTORY } from '../../constants';
import type { SupportCategoryKey } from '../../types';

const BYLAWS_PILLS = [
  { id: 's1', label: '임원진' }, { id: 's2', label: '회비' }, { id: 's3', label: '경조사' },
  { id: 's4', label: '소모임' }, { id: 's5', label: '홈커밍' }, { id: 's6', label: '스승의날' },
  { id: 's7', label: '예비비' }, { id: 's8', label: '공개' }, { id: 's9', label: '개정' },
  { id: 'budget', label: '예산', highlight: true }, { id: 'revisions', label: '이력', highlight: true },
];

const TOC = [
  { num: 1, label: '임원진 구성 및 임기' }, { num: 2, label: '회비 및 운영 원칙' },
  { num: 3, label: '경조사 지원' }, { num: 4, label: '소규모 모임 지원' },
  { num: 5, label: '연례 행사 (홈커밍데이)' }, { num: 6, label: '스승의 날' },
  { num: 7, label: '예비비 운용' }, { num: 8, label: '내역 공개' }, { num: 9, label: '회칙의 개정' },
];

export default function BylawsPanel() {
  const settings = useSettingsStore(s => s.settings);
  const transactions = useTransactionStore(s => s.transactions);
  const [budgetYear, setBudgetYear] = useState(String(new Date().getFullYear()));

  const budget = calcBudget(settings);
  const reserve = settings.monthlyFee * 32 * 12 - budget;
  const totalBudget = budget + Math.max(0, reserve);

  const budgetItems = [
    { name: '홈커밍데이', amount: settings.annualEvent },
    { name: '소규모 모임', amount: settings.smallGatheringCap },
    { name: '예비비', amount: Math.max(0, reserve) },
    { name: '경조사 화환', amount: settings.condolence * 5 },
    { name: '스승의 날', amount: settings.teachersDay },
  ];
  const budgetTotal = budgetItems.reduce((s, i) => s + i.amount, 0);

  // Execution with useMemo
  const { totalDeposits, totalExpenses, totalRate, catData, reserveUsed, reserveBudget, reserveRate } = useMemo(() => {
    const yearTx = transactions.filter(tx => tx.date?.startsWith(budgetYear));
    const deposits = yearTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const expenses = yearTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const rate = totalBudget > 0 ? Math.round(expenses / totalBudget * 100) : 0;

    const cats: { key: SupportCategoryKey; label: string; icon: string }[] = [
      { key: 'condolence', label: '경조사 화환', icon: 'heart' },
      { key: 'smallGathering', label: '소규모 모임', icon: 'users-round' },
      { key: 'annualEvent', label: '홈커밍데이', icon: 'calendar-heart' },
      { key: 'teachersDay', label: '스승의 날', icon: 'graduation-cap' },
    ];

    const _catData = cats.map(c => {
      const budgetAmt = getCatBudget(c.key, settings);
      const spent = yearTx.filter(t => t.type === 'expense' && t.category === c.key).reduce((s, t) => s + t.amount, 0);
      const r = budgetAmt > 0 ? Math.round(spent / budgetAmt * 100) : 0;
      return { ...c, budget: budgetAmt, spent, rate: r };
    });

    const _reserveUsed = _catData.reduce((s, c) => s + Math.max(0, c.spent - c.budget), 0);
    const _reserveBudget = Math.max(0, reserve);
    const _reserveRate = _reserveBudget > 0 ? Math.round(_reserveUsed / _reserveBudget * 100) : 0;

    return {
      totalDeposits: deposits,
      totalExpenses: expenses,
      totalRate: rate,
      catData: _catData,
      reserveUsed: _reserveUsed,
      reserveBudget: _reserveBudget,
      reserveRate: _reserveRate,
    };
  }, [transactions, budgetYear, totalBudget, settings, reserve]);

  const cy = new Date().getFullYear();
  const yearOptions = [];
  for (let y = cy + 1; y >= cy - 3; y--) yearOptions.push(y);

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 space-y-6 w-full">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar no-print pb-1">
        {BYLAWS_PILLS.map(p => (
          <a key={p.id} href={`#${p.id}`} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${p.highlight ? 'text-navy-600 dark:text-navy-400 bg-navy-50 dark:bg-navy-950/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            {p.label}
          </a>
        ))}
      </div>

      {/* TOC */}
      <Card icon={<List className="w-5 h-5" />} title="목차">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
          {TOC.map(t => (
            <a key={t.num} href={`#s${t.num}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
              <span className="w-6 h-6 rounded-md bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{t.num}</span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.label}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* 제1조 */}
      <Section id="s1" icon={<Users className="w-5 h-5" />} tag="제1조" title="임원진 구성 및 임기">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">모임의 안정적인 운영과 업무 연속성을 위해 임원 임기 및 교체 시기를 다음과 같이 규정합니다.</p>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-5 border border-zinc-100 dark:border-zinc-700/50">
          <p className="text-[13px] font-bold mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4 text-navy-500" /> 임기 원칙</p>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mb-4">회장, 총무, 감사의 임기는 <strong className="text-zinc-800 dark:text-zinc-200">2년</strong>을 원칙으로 합니다.</p>
          <p className="text-[13px] font-bold mb-3 flex items-center gap-1.5"><RefreshCw className="w-4 h-4 text-navy-500" /> 연속성 확보 (격년 교체)</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[{ icon: <Crown className="w-4 h-4 text-navy-500 mx-auto mb-1" />, role: '회장', yrs: 3, note: '초대 한정, 이후 2년' },
              { icon: <Briefcase className="w-4 h-4 text-navy-500 mx-auto mb-1" />, role: '총무', yrs: 2, note: '초대부터 동일' },
              { icon: <ShieldCheck className="w-4 h-4 text-navy-500 mx-auto mb-1" />, role: '감사', yrs: 1, note: '초대 한정, 이후 2년' },
            ].map(r => (
              <div key={r.role} className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 text-center">
                {r.icon}
                <p className="text-[12px] font-bold mb-0.5">{r.role}</p>
                <p className="tabular-nums text-xl font-extrabold text-navy-600 dark:text-navy-400">{r.yrs}<span className="text-[11px] font-medium text-zinc-400">년</span></p>
                <p className="text-[10px] text-zinc-500">{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3.5">
          <IconRow icon={<Vote className="w-4 h-4 text-navy-600 dark:text-navy-400" />} title="선출 방식" text="역대 전임 임원진이 회의를 통해 후보를 추천하며, 전체 회원의 2/3 이상 참석, 참석 회원의 4/5 이상 찬성으로 최종 선출합니다." />
          <IconRow icon={<AlertTriangle className="w-4 h-4 text-navy-600 dark:text-navy-400" />} title="중도 사임 및 공백 처리" text="임기 중 사임 시 운영위원회에서 직무대행을 선임합니다. 잔여 임기가 6개월 초과시 보궐 선출합니다." />
        </div>
      </Section>

      {/* 제2조 */}
      <Section id="s2" icon={<Wallet className="w-5 h-5" />} tag="제2조" title="회비 및 운영 원칙">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-navy-50/60 dark:bg-navy-950/20 rounded-xl p-4 border border-navy-100 dark:border-navy-900/30">
            <p className="text-[12px] font-bold mb-0.5">월 회비</p>
            <p className="tabular-nums text-xl font-extrabold text-navy-700 dark:text-navy-400">{fmt(settings.monthlyFee)}<span className="text-[11px] font-medium text-zinc-400">원</span></p>
            <p className="text-[11px] text-zinc-500 mt-0.5">월 수입 약 {(settings.monthlyFee * 32 / 10000).toLocaleString()}만 원 기준</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[12px] font-bold mb-0.5">조정 권한</p>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400">물가 상승 시 <strong className="text-zinc-800 dark:text-zinc-200">1/2 이상 참석, 3/5 이상 찬성</strong>으로 조정 가능</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[12px] font-bold mb-0.5">이월 규정</p>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400">미소진 예산 다음 해 예비비로 <strong className="text-zinc-800 dark:text-zinc-200">전액 이월</strong></p>
          </div>
        </div>
      </Section>

      {/* 제3조 */}
      <Section id="s3" icon={<Heart className="w-5 h-5" />} tag="제3조" title="경조사 지원 (화환)">
        <div className="bg-navy-50/50 dark:bg-navy-950/20 rounded-xl p-4 border border-navy-100 dark:border-navy-900/30 mb-5 flex items-center justify-between flex-wrap gap-2">
          <div><p className="text-[13px] font-bold">지급 기준</p><p className="text-[12px] text-zinc-500">축하/근조 화환 또는 화분</p></div>
          <p className="tabular-nums text-xl font-extrabold text-navy-700 dark:text-navy-400">{fmt(settings.condolence)}<span className="text-[11px] font-medium text-zinc-400">원</span></p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[13px] font-bold mb-2">경사</p>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 mb-1"><Check className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />회원 본인의 최초 1회 결혼</p>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5"><Check className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />연구실 후배 및 동문의 졸업 축하</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[13px] font-bold mb-2">조사</p>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5"><Check className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />회원 본인 및 배우자의 직계존비속 상</p>
          </div>
        </div>
        <InfoBox text={<>연간 기본 <strong>5회</strong> 지원, 초과 시 예비비에서 충당하여 빠짐없이 지원합니다.</>} />
      </Section>

      {/* 제4조 */}
      <Section id="s4" icon={<UsersRound className="w-5 h-5" />} tag="제4조" title="소규모 모임 지원">
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <StatCard value={fmtMan(settings.smallGathering)} unit="만 원" sub="1인당 지원" accent />
          <StatCard value="3" unit="인 이상" sub="최소 참석" />
          <StatCard value={fmtMan(settings.smallGatheringCap)} unit="만 원" sub="연간 한도" />
        </div>
        <InfoBox icon={<Camera className="w-4 h-4 text-navy-600 dark:text-navy-400 mt-0.5 flex-shrink-0" />} text={<><strong>인증 필수:</strong> 영수증 + 참석자 전원 <strong>'인생네컷'</strong> 사진을 단톡방에 공유</>} sub="미제출 시 정산 보류. 소급 인증은 7일 이내." />
      </Section>

      {/* 제5조 */}
      <Section id="s5" icon={<CalendarHeart className="w-5 h-5" />} tag="제5조" title="연례 행사 (홈커밍데이)">
        <div className="bg-navy-50/40 dark:bg-navy-950/20 rounded-xl p-4 border border-navy-100 dark:border-navy-900/30 mb-5 flex items-center justify-between flex-wrap gap-2">
          <div><p className="text-[13px] font-bold">연간 지원 규모</p><p className="text-[12px] text-zinc-500">연 1회 전체 모임 집중 지원</p></div>
          <p className="tabular-nums text-xl font-extrabold text-navy-700 dark:text-navy-400">{fmtMan(settings.annualEvent)}<span className="text-[11px] font-medium text-zinc-400">만 원</span></p>
        </div>
      </Section>

      {/* 제6조 */}
      <Section id="s6" icon={<GraduationCap className="w-5 h-5" />} tag="제6조" title="스승의 날">
        <div className="bg-navy-50/40 dark:bg-navy-950/20 rounded-xl p-4 border border-navy-100 dark:border-navy-900/30 mb-5 flex items-center justify-between flex-wrap gap-2">
          <div><p className="text-[13px] font-bold">연간 지원 규모</p><p className="text-[12px] text-zinc-500">감사 인사</p></div>
          <p className="tabular-nums text-xl font-extrabold text-navy-700 dark:text-navy-400">{fmtMan(settings.teachersDay)}<span className="text-[11px] font-medium text-zinc-400">만 원</span></p>
        </div>
      </Section>

      {/* 제7조 */}
      <Section id="s7" icon={<PiggyBank className="w-5 h-5" />} tag="제7조" title="예비비 운용">
        <div className="bg-navy-50/40 dark:bg-navy-950/20 rounded-xl p-4 border border-navy-100 dark:border-navy-900/30 flex items-center justify-between flex-wrap gap-2">
          <div><p className="text-[13px] font-bold">예비비 규모</p><p className="text-[12px] text-zinc-500">비상금 + 이월 잔액</p></div>
          <p className="tabular-nums text-xl font-extrabold text-navy-700 dark:text-navy-400">{fmtMan(Math.max(0, reserve))}<span className="text-[11px] font-medium text-zinc-400">만 원</span></p>
        </div>
      </Section>

      {/* 제8조 */}
      <Section id="s8" icon={<Eye className="w-5 h-5" />} tag="제8조" title="내역 공개">
        <InfoBox text={<>모든 회비 입출금 내역, 집행 내역은 본 시스템을 통해 <strong>투명하게 공개</strong>됩니다. 전체 회원은 언제든지 열람 가능합니다.</>} />
      </Section>

      {/* 제9조 */}
      <Section id="s9" icon={<FileEdit className="w-5 h-5" />} tag="제9조" title="회칙의 개정">
        <InfoBox text={<>회칙 개정은 전체 회원의 <strong>2/3 이상 참석, 참석 회원의 3/5 이상 찬성</strong>으로 가능하며, 개정 이력은 하단에 기록됩니다.</>} />
      </Section>

      {/* Budget Section */}
      <Card id="budget" icon={<BarChart3 className="w-5 h-5" />} title="연간 예산 배정">
        <div className="space-y-4 mb-6">
          {budgetItems.map(it => {
            const pct = budgetTotal > 0 ? (it.amount / budgetTotal * 100) : 0;
            return (
              <div key={it.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-navy-500 flex-shrink-0" /><span className="text-[13px] font-medium">{it.name}</span></div>
                  <span className="text-[13px] font-bold tabular-nums">{fmtMan(it.amount)}만 원</span>
                </div>
                <div className="budget-bar"><div className="budget-fill bg-navy-500" style={{ width: `${pct.toFixed(2)}%` }} /></div>
                <p className="text-right text-[11px] text-zinc-400 mt-0.5">{pct.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Budget Execution */}
      <Card id="budget-exec" icon={<BarChart3 className="w-5 h-5" />} title="예산 집행 현황" extra={
        <select value={budgetYear} onChange={e => setBudgetYear(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      }>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryMini label="연간 수입 (입금)" value={fmt(totalDeposits)} unit="원" />
          <SummaryMini label="연간 지출 (집행)" value={fmt(totalExpenses)} unit="원" />
          <SummaryMini label="총 집행률" value={String(totalRate)} unit="%" colorClass={totalRate > 100 ? 'text-red-600 dark:text-red-400' : totalRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} />
        </div>
        <div className="space-y-4">
          {[...catData, { label: '예비비', budget: reserveBudget, spent: reserveUsed, rate: reserveRate }].map((c, i) => {
            const budgetPct = totalBudget > 0 ? (c.budget / totalBudget * 100) : 0;
            const spentPct = totalBudget > 0 ? (c.spent / totalBudget * 100) : 0;
            const rateColor = c.rate > 100 ? 'text-red-600 dark:text-red-400' : c.rate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-navy-600 dark:text-navy-400';
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium">{c.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400">배정 {fmtMan(c.budget)}만</span>
                    <span className="text-[13px] font-bold tabular-nums">{fmt(c.spent)}<span className="text-[11px] text-zinc-400 font-medium ml-0.5">원</span></span>
                    <span className={`text-[12px] font-bold tabular-nums ${rateColor}`}>{c.rate}%</span>
                  </div>
                </div>
                <div className="budget-bar-dual">
                  <div className="bar-budget bg-navy-500" style={{ width: `${budgetPct.toFixed(2)}%` }} />
                  <div className="bar-spent bg-navy-600" style={{ width: `${Math.min(spentPct, 100).toFixed(2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revision History */}
      <Card id="revisions" icon={<FileEdit className="w-5 h-5" />} title="개정 이력">
        {REVISION_HISTORY.map((rev, i) => (
          <div key={i} className="relative pl-6 pb-2 border-l-2 border-zinc-100 dark:border-zinc-700 last:border-0 last:pb-0">
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-navy-500 border-2 border-white dark:border-zinc-800" />
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{rev.date}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">v{rev.version}</span>
              <span className="text-xs text-zinc-500">by {rev.editor}</span>
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{rev.summary}</p>
            <ul className="space-y-1">
              {rev.details.map((d, di) => (
                <li key={di} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1.5 shrink-0" />{d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
    </main>
  );
}

// ── Helpers ──

function Card({ id, icon, title, children, extra }: { id?: string; icon: React.ReactNode; title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div id={id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 relative overflow-hidden">
      <div className="accent-bar" />
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="badge-icon bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">{icon}</div>
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Section({ id, icon, tag, title, children }: { id: string; icon: React.ReactNode; tag: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 sm:p-7 relative overflow-hidden">
      <div className="accent-bar" />
      <div className="flex items-center gap-2.5 mb-5 pt-1">
        <div className="badge-icon bg-navy-50 dark:bg-navy-950/50 text-navy-600 dark:text-navy-400">{icon}</div>
        <div>
          <span className="tag bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400">{tag}</span>
          <h2 className="text-lg font-bold mt-0.5">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function IconRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-md bg-navy-50 dark:bg-navy-950/50 flex items-center justify-center mt-0.5 flex-shrink-0">{icon}</div>
      <div><p className="text-[13px] font-bold mb-0.5">{title}</p><p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{text}</p></div>
    </div>
  );
}

function InfoBox({ icon, text, sub }: { icon?: React.ReactNode; text: React.ReactNode; sub?: string }) {
  return (
    <div className="flex gap-2.5 bg-navy-50/60 dark:bg-navy-950/20 rounded-lg p-3.5 border border-navy-100 dark:border-navy-900/30">
      {icon || <Info className="w-4 h-4 text-navy-600 dark:text-navy-400 mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{text}</p>
        {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StatCard({ value, unit, sub, accent }: { value: string; unit: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3.5 border text-center ${accent ? 'bg-navy-50/50 dark:bg-navy-950/20 border-navy-100 dark:border-navy-900/30' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}>
      <p className={`tabular-nums text-lg font-extrabold ${accent ? 'text-navy-700 dark:text-navy-400' : ''}`}>{value}<span className="text-[11px] font-medium text-zinc-400">{unit}</span></p>
      <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>
    </div>
  );
}

function SummaryMini({ label, value, unit, colorClass }: { label: string; value: string; unit: string; colorClass?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
      <p className="text-[11px] text-zinc-500 mb-0.5">{label}</p>
      <p className={`tabular-nums text-lg font-extrabold ${colorClass || 'text-navy-600 dark:text-navy-400'}`}>{value}<span className="text-[11px] font-medium text-zinc-400">{unit}</span></p>
    </div>
  );
}
