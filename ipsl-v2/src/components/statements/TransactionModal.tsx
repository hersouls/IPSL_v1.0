import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUiStore } from '../../stores/uiStore';
import { SUPPORT_CATS } from '../../constants';
import { fmtInputValue, parseFmt } from '../../utils/format';
import type { SupportCategoryKey } from '../../types';
import { Heart, UsersRound, CalendarHeart, GraduationCap } from 'lucide-react';

const CAT_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className="w-3 h-3" />,
  'users-round': <UsersRound className="w-3 h-3" />,
  'calendar-heart': <CalendarHeart className="w-3 h-3" />,
  'graduation-cap': <GraduationCap className="w-3 h-3" />,
};

export default function TransactionModal() {
  const { txModalOpen, editTxId, closeTxModal, showToast } = useUiStore();
  const transactions = useTransactionStore(s => s.transactions);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);

  const existing = editTxId ? transactions.find(t => t.id === editTxId) : null;
  const isEdit = !!existing;

  const [type, setType] = useState<'deposit' | 'expense'>('deposit');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (txModalOpen) {
      if (existing) {
        setType(existing.type);
        setDate(existing.date);
        setAmount(existing.amount ? existing.amount.toLocaleString() : '');
        setDescription(existing.description || '');
        setCategory(existing.category);
      } else {
        setType('deposit');
        setDate(new Date().toISOString().slice(0, 10));
        setAmount('');
        setDescription('');
        setCategory(null);
      }
    }
  }, [txModalOpen, editTxId]);

  const handleSave = () => {
    const amt = parseFmt(amount);
    if (amt <= 0) { alert('금액을 입력하세요.'); return; }
    if (!date) { alert('날짜를 선택하세요.'); return; }

    const data = {
      type,
      date,
      amount: amt,
      description: description.trim(),
      category: type === 'expense' ? category : null,
      eventId: existing?.eventId ?? null,
      feeRef: existing?.feeRef ?? null,
    };

    if (isEdit && editTxId) {
      updateTransaction(editTxId, data);
      showToast('내역이 수정되었습니다');
    } else {
      addTransaction(data);
      showToast('내역이 추가되었습니다');
    }
    closeTxModal();
  };

  const handleDelete = () => {
    if (!editTxId) return;
    const tx = transactions.find(t => t.id === editTxId);
    const hasEvent = tx?.eventId;
    if (!confirm('이 내역을 삭제하시겠습니까?' + (hasEvent ? '\n연결된 지원 내역도 함께 삭제됩니다.' : ''))) return;
    deleteTransaction(editTxId);
    closeTxModal();
    showToast('내역이 삭제되었습니다');
  };

  if (!txModalOpen) return null;

  return (
    <Modal open={txModalOpen} onClose={closeTxModal} title={isEdit ? '내역 수정' : '입출금 등록'}>
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('deposit')}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
              type === 'deposit'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            입금
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
              type === 'expense'
                ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700'
                : 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            사용 (지출)
          </button>
        </div>

        {/* Category (expense only) */}
        {type === 'expense' && (
          <div>
            <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">카테고리 (선택)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(SUPPORT_CATS) as [SupportCategoryKey, typeof SUPPORT_CATS[SupportCategoryKey]][]).map(([key, cat]) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(active ? null : key)}
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
          </div>
        )}

        {/* Date */}
        <Field label="날짜">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
        </Field>

        {/* Amount */}
        <Field label="금액">
          <input
            value={amount}
            onChange={e => setAmount(fmtInputValue(e.target.value))}
            className="input-field text-right"
            placeholder="0"
          />
        </Field>

        {/* Description */}
        <Field label="설명">
          <input value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="내역 설명" />
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
