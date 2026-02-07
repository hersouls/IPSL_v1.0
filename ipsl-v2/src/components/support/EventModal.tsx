import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useEventStore } from '../../stores/eventStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useMemberStore } from '../../stores/memberStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { SUPPORT_CATS } from '../../constants';
import { fmt, fmtInputValue, parseFmt } from '../../utils/format';
import { Heart, UsersRound, CalendarHeart, GraduationCap } from 'lucide-react';
import type { SupportCategoryKey } from '../../types';

const CAT_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className="w-3 h-3" />,
  'users-round': <UsersRound className="w-3 h-3" />,
  'calendar-heart': <CalendarHeart className="w-3 h-3" />,
  'graduation-cap': <GraduationCap className="w-3 h-3" />,
};

export default function EventModal() {
  const { eventModalOpen, editEventId, closeEventModal, showToast } = useUiStore();
  const events = useEventStore(s => s.events);
  const addEvent = useEventStore(s => s.addEvent);
  const updateEvent = useEventStore(s => s.updateEvent);
  const deleteEvent = useEventStore(s => s.deleteEvent);
  const transactions = useTransactionStore(s => s.transactions);
  const setTransactions = useTransactionStore(s => s.setTransactions);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const members = useMemberStore(s => s.members);
  const settings = useSettingsStore(s => s.settings);

  const existing = editEventId ? events.find(e => e.id === editEventId) : null;
  const isEdit = !!existing;

  const [category, setCategory] = useState<SupportCategoryKey>('condolence');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [targetMember, setTargetMember] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (eventModalOpen) {
      if (existing) {
        setCategory((existing.category as SupportCategoryKey) || 'condolence');
        setDate(existing.date || '');
        setTitle(existing.title || '');
        setLocation(existing.location || '');
        setTargetMember(existing.targetMember || '');
        setParticipants(existing.participants || []);
        setAmount(existing.amount ? existing.amount.toLocaleString() : '');
        setMemo(existing.memo || '');
      } else {
        setCategory('condolence');
        setDate(new Date().toISOString().slice(0, 10));
        setTitle('');
        setLocation('');
        setTargetMember('');
        setParticipants([]);
        setAmount('');
        setMemo('');
      }
    }
  }, [eventModalOpen, editEventId]);

  const toggleParticipant = (mid: string) => {
    setParticipants(prev => {
      const next = prev.includes(mid) ? prev.filter(p => p !== mid) : [...prev, mid];
      // Auto-calc for smallGathering
      if (category === 'smallGathering') {
        const calcAmt = next.length * settings.smallGathering;
        setAmount(calcAmt > 0 ? calcAmt.toLocaleString() : '');
      }
      return next;
    });
  };

  const handleCategoryChange = (cat: SupportCategoryKey) => {
    setCategory(cat);
    // Set default amount based on category
    if (cat === 'condolence' && !amount) setAmount(settings.condolence.toLocaleString());
    else if (cat === 'annualEvent' && !amount) setAmount(settings.annualEvent.toLocaleString());
    else if (cat === 'teachersDay' && !amount) setAmount(settings.teachersDay.toLocaleString());
    else if (cat === 'smallGathering') {
      const calcAmt = participants.length * settings.smallGathering;
      if (calcAmt > 0) setAmount(calcAmt.toLocaleString());
    }
  };

  const amountHint = (): string => {
    if (category === 'condolence') return `기준액: ${fmt(settings.condolence)}원`;
    if (category === 'smallGathering') {
      if (participants.length > 0)
        return `${participants.length}명 x ${fmt(settings.smallGathering)}원 = ${fmt(participants.length * settings.smallGathering)}원`;
      return `1인당 ${fmt(settings.smallGathering)}원 (참석자 선택 시 자동계산)`;
    }
    if (category === 'annualEvent') return `기준액: ${fmt(settings.annualEvent)}원`;
    if (category === 'teachersDay') return `기준액: ${fmt(settings.teachersDay)}원`;
    return '';
  };

  const titleLabel = (): string => {
    if (category === 'condolence') return '사유 (결혼/상 등)';
    if (category === 'smallGathering') return '모임명';
    return '행사명';
  };

  const handleSave = () => {
    if (!title.trim()) { alert('제목/사유를 입력하세요.'); return; }
    const amt = parseFmt(amount);
    if (amt <= 0) { alert('금액을 입력하세요.'); return; }
    if (!date) { alert('날짜를 선택하세요.'); return; }

    const evParticipants = (category === 'smallGathering' || category === 'annualEvent') ? participants : [];

    const data = {
      category,
      date,
      title: title.trim(),
      location: location.trim(),
      targetMember: category === 'condolence' ? targetMember : '',
      participants: evParticipants,
      amount: amt,
      memo: memo.trim(),
    };

    if (isEdit && existing) {
      updateEvent(existing.id, data);
      // Update linked transaction
      if (existing.txId) {
        const tx = transactions.find(t => t.id === existing.txId);
        if (tx) {
          const updated = transactions.map(t =>
            t.id === existing.txId ? { ...t, date: data.date, amount: data.amount, description: data.title, category: data.category } : t
          );
          setTransactions(updated);
        }
      }
      showToast('지원 내역이 수정되었습니다');
    } else {
      // Create event and auto-create linked transaction
      const ev = addEvent({ ...data, txId: null });
      // Create linked expense transaction
      addTransaction({
        type: 'expense',
        date: data.date,
        amount: data.amount,
        description: data.title,
        category: data.category,
        eventId: ev.id,
        feeRef: null,
      });
      // Update event with txId
      const latestTx = useTransactionStore.getState().transactions;
      const linkedTx = latestTx.find(t => t.eventId === ev.id);
      if (linkedTx) {
        updateEvent(ev.id, { txId: linkedTx.id });
      }
      showToast('지원 내역이 등록되었습니다');
    }
    closeEventModal();
  };

  const handleDelete = () => {
    if (!existing) return;
    if (!confirm((existing.title || '이 내역') + '을(를) 삭제하시겠습니까?\n연결된 거래내역도 함께 삭제됩니다.')) return;
    if (existing.txId) {
      deleteTransaction(existing.txId);
    }
    deleteEvent(existing.id);
    closeEventModal();
    showToast('지원 내역이 삭제되었습니다');
  };

  if (!eventModalOpen) return null;

  return (
    <Modal open={eventModalOpen} onClose={closeEventModal} title={isEdit ? '지원 수정' : '지원 등록'}>
      <div className="space-y-4">
        {/* Category selector */}
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.entries(SUPPORT_CATS) as [SupportCategoryKey, typeof SUPPORT_CATS[SupportCategoryKey]][]).map(([key, cat]) => {
            const active = key === category;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`py-2 text-[11px] font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${
                  active
                    ? 'border-navy-500 bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                }`}
              >
                {CAT_ICONS[cat.icon]}{cat.label}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <Field label="날짜">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
        </Field>

        {/* Title */}
        <Field label={titleLabel()}>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="제목을 입력하세요" />
        </Field>

        {/* Target member (condolence only) */}
        {category === 'condolence' && (
          <Field label="대상 회원">
            <select value={targetMember} onChange={e => setTargetMember(e.target.value)} className="input-field">
              <option value="">선택하세요</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}{m.cohort ? ` (${m.cohort})` : ''}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Participants (smallGathering, annualEvent) */}
        {(category === 'smallGathering' || category === 'annualEvent') && (
          <Field label={`참석자 (${participants.length}명 선택)`}>
            <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 space-y-0.5">
              {members.map(m => (
                <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={participants.includes(m.id)}
                    onChange={() => toggleParticipant(m.id)}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm">{m.name}</span>
                  <span className="text-[10px] text-zinc-400">{m.cohort || ''}</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        {/* Location */}
        <Field label="장소">
          <input value={location} onChange={e => setLocation(e.target.value)} className="input-field" placeholder="(선택사항)" />
        </Field>

        {/* Amount */}
        <Field label="금액">
          <input
            value={amount}
            onChange={e => setAmount(fmtInputValue(e.target.value))}
            className="input-field text-right"
            placeholder="0"
          />
          <p className="text-[11px] text-zinc-400 mt-1">{amountHint()}</p>
        </Field>

        {/* Memo */}
        <Field label="메모">
          <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input-field" rows={2} placeholder="(선택사항)" />
        </Field>

        <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          {isEdit ? '수정하기' : '등록하기'}
        </button>
        {isEdit && (
          <button onClick={handleDelete} className="w-full py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors">
            삭제하기
          </button>
        )}
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
