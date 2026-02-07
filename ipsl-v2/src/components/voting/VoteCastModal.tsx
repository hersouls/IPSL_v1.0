import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, CheckCircle2, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import { useVotingStore } from '../../stores/votingStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { VOTE_CHOICES, DEFAULT_MEMBER_PIN, MASTER_PIN } from '../../constants';
import type { VoteChoice } from '../../types';

type Step = 'select' | 'pin' | 'vote';

const CHOICE_KEYS: VoteChoice[] = ['approve', 'reject', 'abstain'];

export default function VoteCastModal() {
  const { voteAuthModalOpen, voteAuthSessionId, closeVoteAuthModal, showToast } = useUiStore();
  const sessions = useVotingStore(s => s.sessions);
  const castVote = useVotingStore(s => s.castVote);
  const members = useMemberStore(s => s.members);

  const session = voteAuthSessionId ? sessions.find(s => s.id === voteAuthSessionId) : null;

  const [step, setStep] = useState<Step>('select');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [search, setSearch] = useState('');
  const pinRef = useRef<HTMLInputElement>(null);

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;

  useEffect(() => {
    if (voteAuthModalOpen) {
      setStep('select');
      setSelectedMemberId(null);
      setPinInput('');
      setPinError(false);
      setShowPin(false);
      setChoice(null);
      setSearch('');
    }
  }, [voteAuthModalOpen]);

  useEffect(() => {
    if (step === 'pin') {
      setTimeout(() => pinRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSelectMember = (memberId: string) => {
    if (session?.votes[memberId]) return; // already voted
    setSelectedMemberId(memberId);
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (!selectedMember) return;
    const memberPin = selectedMember.pin || DEFAULT_MEMBER_PIN;
    if (pinInput !== memberPin && pinInput !== MASTER_PIN) {
      setPinError(true);
      setPinInput('');
      pinRef.current?.focus();
      return;
    }
    setPinError(false);
    setStep('vote');
  };

  const handleVoteSubmit = () => {
    if (!choice || !voteAuthSessionId || !selectedMemberId) return;
    castVote(voteAuthSessionId, selectedMemberId, choice);
    showToast('투표가 완료되었습니다');
    closeVoteAuthModal();
  };

  const filteredMembers = members
    .filter(m => {
      if (!search) return true;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.cohort || '').toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const stepTitle = step === 'select' ? '투표 참여' : step === 'pin' ? '본인 확인' : '투표하기';

  return (
    <Modal open={voteAuthModalOpen} onClose={closeVoteAuthModal} title={stepTitle}>
      {!session ? null : step === 'select' ? (
        /* ── Step 1: Member Selection ── */
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-950/30">
            <p className="text-xs font-bold text-navy-700 dark:text-navy-300 mb-0.5">안건</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{session.title}</p>
          </div>

          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">투표할 회원을 선택하세요</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-xs"
              placeholder="이름 또는 기수 검색"
            />
          </div>

          {/* Member grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
            {filteredMembers.map(m => {
              const voted = !!session.votes[m.id];
              const initial = (m.name || '?').charAt(0);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMember(m.id)}
                  disabled={voted}
                  className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-colors ${
                    voted
                      ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-700/50'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-950/20'
                  }`}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-sm font-bold text-navy-600 dark:text-navy-400">
                      {initial}
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate w-full">{m.name}</span>
                  <span className="text-[10px] text-zinc-400 truncate w-full">{m.cohort?.split(' ')[0] || ''}</span>
                  {voted && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 dark:bg-zinc-900/60">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : step === 'pin' ? (
        /* ── Step 2: PIN Authentication ── */
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2">
            {selectedMember?.avatar ? (
              <img src={selectedMember.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-navy-200 dark:border-navy-800" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-2xl font-bold text-navy-600 dark:text-navy-400 border-2 border-navy-200 dark:border-navy-800">
                {(selectedMember?.name || '?').charAt(0)}
              </div>
            )}
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedMember?.name} 님</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedMember?.cohort || ''}</p>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">4자리 비밀번호를 입력하세요</p>

          <div className="relative">
            <input
              ref={pinRef}
              type={showPin ? 'text' : 'password'}
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              className={`input-field text-center pr-10 tracking-widest ${pinError ? 'border-red-400 dark:border-red-500' : ''}`}
              placeholder="0000"
              maxLength={4}
              inputMode="numeric"
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pinError && <p className="text-xs text-red-500 text-center">비밀번호가 올바르지 않습니다.</p>}

          <div className="flex gap-2">
            <button onClick={() => { setStep('select'); setSelectedMemberId(null); setPinInput(''); setPinError(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
              뒤로
            </button>
            <button onClick={handlePinSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
              확인
            </button>
          </div>
        </div>
      ) : (
        /* ── Step 3: Cast Vote ── */
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-950/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">안건</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{session.title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">투표자: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedMember?.name}</span></p>
          </div>

          <div className="space-y-2">
            {CHOICE_KEYS.map(k => {
              const info = VOTE_CHOICES[k];
              const selected = choice === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChoice(k)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selected
                      ? k === 'approve'
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : k === 'reject'
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'border-zinc-400 bg-zinc-50 dark:bg-zinc-700/50'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected
                      ? k === 'approve' ? 'border-emerald-500 bg-emerald-500' :
                        k === 'reject' ? 'border-red-500 bg-red-500' :
                        'border-zinc-400 bg-zinc-400'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-bold ${
                    selected
                      ? k === 'approve' ? 'text-emerald-700 dark:text-emerald-400' :
                        k === 'reject' ? 'text-red-600 dark:text-red-400' :
                        'text-zinc-600 dark:text-zinc-300'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {info.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleVoteSubmit}
            disabled={!choice}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              choice
                ? 'bg-navy-600 text-white hover:bg-navy-700'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            투표 제출하기
          </button>
        </div>
      )}
    </Modal>
  );
}
