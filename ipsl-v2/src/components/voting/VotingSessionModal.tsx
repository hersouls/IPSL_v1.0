import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useVotingStore } from '../../stores/votingStore';
import { useUiStore } from '../../stores/uiStore';
import { VOTING_TOPICS } from '../../constants';
import type { VotingTopic } from '../../types';

const TOPIC_KEYS = Object.keys(VOTING_TOPICS) as VotingTopic[];

export default function VotingSessionModal() {
  const { votingModalOpen, editVotingSessionId, closeVotingModal, showToast } = useUiStore();
  const sessions = useVotingStore(s => s.sessions);
  const addSession = useVotingStore(s => s.addSession);
  const updateSession = useVotingStore(s => s.updateSession);

  const existing = editVotingSessionId ? sessions.find(s => s.id === editVotingSessionId) : null;
  const isEdit = !!existing;

  const [topic, setTopic] = useState<VotingTopic>('officer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (votingModalOpen) {
      if (existing) {
        setTopic(existing.topic);
        setTitle(existing.title);
        setDescription(existing.description);
        setEndDate(existing.endDate || '');
      } else {
        setTopic('officer');
        setTitle('');
        setDescription('');
        // Default: 7 days from today
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setEndDate(d.toISOString().slice(0, 10));
      }
    }
  }, [votingModalOpen, editVotingSessionId]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) { showToast('안건 제목을 입력하세요.'); return; }
    if (!endDate) { showToast('투표 마감일을 선택하세요.'); return; }

    if (isEdit && editVotingSessionId) {
      updateSession(editVotingSessionId, {
        topic,
        title: trimmed,
        description: description.trim(),
        endDate,
      });
      showToast('안건이 수정되었습니다');
    } else {
      addSession({
        topic,
        title: trimmed,
        description: description.trim(),
        endDate,
        status: 'open',
      });
      showToast('새 안건이 등록되었습니다');
    }
    closeVotingModal();
  };

  return (
    <Modal open={votingModalOpen} onClose={closeVotingModal} title={isEdit ? '안건 수정' : '새 안건 등록'}>
      <div className="space-y-4">
        <Field label="안건 종류 *">
          <select value={topic} onChange={e => setTopic(e.target.value as VotingTopic)} className="input-field">
            {TOPIC_KEYS.map(k => (
              <option key={k} value={k}>
                {VOTING_TOPICS[k].label} ({VOTING_TOPICS[k].article})
              </option>
            ))}
          </select>
        </Field>

        <Field label="안건 제목 *">
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="예: 2026년 임원진 선출" />
        </Field>

        <Field label="상세 설명">
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={3} placeholder="안건에 대한 상세 설명을 입력하세요" />
        </Field>

        <Field label="투표 마감일 *">
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" min={new Date().toISOString().slice(0, 10)} />
        </Field>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
          <p className="font-semibold mb-1">포지티브 투표 방식</p>
          <p>마감일까지 투표하지 않은 회원은 <strong>자동 참석 · 자동 찬성</strong> 처리됩니다.</p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/50 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="font-semibold mb-1">의결 기준</p>
          <p>정족수: 전체 회원의 <strong className="text-zinc-700 dark:text-zinc-300">{VOTING_TOPICS[topic]?.quorumLabel}</strong> 이상 참석</p>
          <p>의결: 참석 회원의 <strong className="text-zinc-700 dark:text-zinc-300">{VOTING_TOPICS[topic]?.thresholdLabel}</strong> 이상 찬성 시 가결</p>
        </div>

        <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          {isEdit ? '수정하기' : '등록하기'}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
