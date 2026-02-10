import { useState, useRef, useEffect } from 'react';
import { Plus, Lock, Eye, EyeOff, CheckCircle2, XCircle, Clock, CalendarClock, Search } from 'lucide-react';
import MemberAvatar from '../ui/MemberAvatar';
import { useVotingStore } from '../../stores/votingStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { VOTING_TOPICS, VOTE_CHOICES, STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import type { VotingSession } from '../../types';
import SummaryCard from '../ui/SummaryCard';
import EmptyState from '../ui/EmptyState';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function VotingPanel() {
  const sessions = useVotingStore(s => s.sessions);
  const closeSession = useVotingStore(s => s.closeSession);
  const deleteSession = useVotingStore(s => s.deleteSession);
  const members = useMemberStore(s => s.members);
  const { openVotingModal, openVoteAuthModal, showToast } = useUiStore();

  // Auto-close expired sessions (positive voting)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const memberIds = members.map(m => m.id);
    sessions.forEach(s => {
      if (s.status === 'open' && s.endDate && s.endDate <= today) {
        closeSession(s.id, memberIds);
      }
    });
  }, [sessions, members, closeSession]);

  // Admin PIN dialog
  const [pinAction, setPinAction] = useState<{ type: 'create' | 'close' | 'delete'; sessionId?: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const openSessions = sessions.filter(s => s.status === 'open');
  const closedSessions = sessions.filter(s => s.status === 'closed');

  const filteredOpen = openSessions.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
  });
  const filteredClosed = closedSessions.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
  });

  const requestPin = (type: 'create' | 'close' | 'delete', sessionId?: string) => {
    setPinAction({ type, sessionId });
    setPinInput('');
    setPinError(false);
    setShowPin(false);
    setTimeout(() => pinRef.current?.focus(), 100);
  };

  const handlePinSubmit = () => {
    if (pinInput !== getPin() && pinInput !== MASTER_PIN) {
      setPinError(true);
      setPinInput('');
      pinRef.current?.focus();
      return;
    }
    if (!pinAction) return;

    if (pinAction.type === 'create') {
      openVotingModal();
    } else if (pinAction.type === 'close' && pinAction.sessionId) {
      closeSession(pinAction.sessionId, members.map(m => m.id));
      showToast('투표가 마감되었습니다 (미투표 회원은 자동 찬성 처리)');
    } else if (pinAction.type === 'delete' && pinAction.sessionId) {
      deleteSession(pinAction.sessionId);
      showToast('안건이 삭제되었습니다');
    }
    setPinAction(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-6 flex-1 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">투표 관리</h2>
        <button onClick={() => requestPin('create')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 새 안건 등록
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="안건 검색..."
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryCard label="진행 중" value={String(openSessions.length)} unit="건" />
        <SummaryCard label="완료" value={String(closedSessions.length)} unit="건" />
      </div>

      {filteredOpen.length === 0 && filteredClosed.length === 0 && <EmptyState message="등록된 안건이 없습니다" />}

      {/* Open sessions */}
      {filteredOpen.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">진행 중</h3>
          <div className="space-y-3">
            {filteredOpen.map(s => (
              <SessionCard key={s.id} session={s} members={members} onVote={() => openVoteAuthModal(s.id)} onClose={() => requestPin('close', s.id)} onDelete={() => requestPin('delete', s.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Closed sessions */}
      {filteredClosed.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">완료</h3>
          <div className="space-y-3">
            {filteredClosed.map(s => (
              <SessionCard key={s.id} session={s} members={members} onDelete={() => requestPin('delete', s.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Admin PIN dialog overlay */}
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
    </main>
  );
}

function SessionCard({
  session, members, onVote, onClose, onDelete,
}: {
  session: VotingSession;
  members: { id: string; name: string; avatar?: string }[];
  onVote?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
}) {
  const topicInfo = VOTING_TOPICS[session.topic] || { label: session.topic, article: '' };
  const totalMembers = members.length;
  const voteEntries = Object.entries(session.votes);
  const votedCount = voteEntries.length;
  const approveCount = voteEntries.filter(([, v]) => v === 'approve').length;
  const rejectCount = voteEntries.filter(([, v]) => v === 'reject').length;
  const abstainCount = voteEntries.filter(([, v]) => v === 'abstain').length;
  const pct = totalMembers > 0 ? Math.round((votedCount / totalMembers) * 100) : 0;
  const quorum = topicInfo.quorum || 0.5;
  const threshold = topicInfo.threshold || 0.5;
  const quorumMet = votedCount >= Math.ceil(totalMembers * quorum);
  const approvePctOfVoters = votedCount > 0 ? ((approveCount / votedCount) * 100).toFixed(1) : '0';
  const thresholdMet = approveCount >= Math.ceil(votedCount * threshold);
  const passed = quorumMet && thresholdMet;
  const isOpen = session.status === 'open';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-navy-100 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300">
            {topicInfo.article}
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{topicInfo.label}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isOpen
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
        }`}>
          {isOpen ? '진행 중' : '마감됨'}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{session.title}</h4>
      {session.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 line-clamp-2">{session.description}</p>
      )}

      {/* Deadline */}
      {session.endDate && (
        <div className="flex items-center gap-1.5 text-[11px] mb-3">
          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-zinc-500 dark:text-zinc-400">
            마감: {session.endDate}
            {isOpen && (() => {
              const diff = Math.ceil((new Date(session.endDate + 'T23:59:59').getTime() - Date.now()) / 86400000);
              if (diff < 0) return ' (마감됨)';
              if (diff === 0) return ' (오늘 마감)';
              return ` (D-${diff})`;
            })()}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
          <span>참여율</span>
          <span className="font-semibold">{votedCount}/{totalMembers}명 ({pct}%)</span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className="h-full bg-navy-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="flex items-center gap-4 text-[11px] font-semibold mb-2">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          {VOTE_CHOICES.approve.label} {approveCount}
        </span>
        <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
          {VOTE_CHOICES.reject.label} {rejectCount}
        </span>
        <span className="flex items-center gap-1 text-zinc-400">
          {VOTE_CHOICES.abstain.label} {abstainCount}
        </span>
      </div>

      {/* Positive voting notice */}
      {isOpen && totalMembers - votedCount > 0 && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-3">
          미투표 {totalMembers - votedCount}명은 마감 시 자동 찬성 처리됩니다
        </p>
      )}

      {/* Result badge for closed */}
      {!isOpen && (
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold mb-3 ${
          passed
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {passed
            ? `가결 — 정족수 충족, 찬성 ${approvePctOfVoters}% (기준: ${topicInfo.thresholdLabel || '1/2'})`
            : !quorumMet
            ? `부결 — 정족수 미달 (참석 ${votedCount}/${Math.ceil(totalMembers * quorum)}명 필요)`
            : `부결 — 찬성 미달 (찬성 ${approvePctOfVoters}%, 기준: ${topicInfo.thresholdLabel || '1/2'})`}
        </div>
      )}

      {/* Voted members list for closed sessions */}
      {!isOpen && votedCount > 0 && (
        <VotedMemberList session={session} members={members} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isOpen && onVote && (
          <button onClick={onVote} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
            투표 참여하기
          </button>
        )}
        {isOpen && onClose && (
          <button onClick={onClose} className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
            마감
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

function VotedMemberList({ session, members }: { session: VotingSession; members: { id: string; name: string; avatar?: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const voteEntries = Object.entries(session.votes);

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="text-[11px] text-navy-600 dark:text-navy-400 font-semibold hover:underline mb-3">
        투표 명단 보기 ({voteEntries.length}명)
      </button>
    );
  }

  return (
    <div className="mb-3">
      <button onClick={() => setExpanded(false)} className="text-[11px] text-navy-600 dark:text-navy-400 font-semibold hover:underline mb-2">
        투표 명단 접기
      </button>
      <div className="space-y-1">
        {voteEntries.map(([mid, choice]) => {
          const m = members.find(x => x.id === mid);
          const info = VOTE_CHOICES[choice];
          const isAuto = (session.autoApproved || []).includes(mid);
          return (
            <div key={mid} className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 ${isAuto ? 'opacity-60' : ''}`}>
              <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MemberAvatar name={m?.name || '?'} avatar={m?.avatar} size="xs" />
                {m?.name || '(탈퇴 회원)'}
              </span>
              <span className={`font-bold ${
                choice === 'approve' ? 'text-emerald-600 dark:text-emerald-400' :
                choice === 'reject' ? 'text-red-500 dark:text-red-400' :
                'text-zinc-400'
              }`}>{isAuto ? '자동 찬성' : (info?.label || choice)}</span>
            </div>
          );
        })}
        {/* Non-voters (only shown for open sessions — closed sessions have auto-approve) */}
        {members.filter(m => !session.votes[m.id]).map(m => (
          <div key={m.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 opacity-50">
            <span className="font-medium text-zinc-500 flex items-center gap-1.5">
              <MemberAvatar name={m.name} avatar={m.avatar} size="xs" />
              {m.name}
            </span>
            <span className="text-zinc-400">미투표</span>
          </div>
        ))}
      </div>
    </div>
  );
}
