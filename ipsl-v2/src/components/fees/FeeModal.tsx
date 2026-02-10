import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useFeeStore } from '../../stores/feeStore';
import { useMemberStore } from '../../stores/memberStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { MONTHS } from '../../constants';
import { fmtInputValue, parseFmt } from '../../utils/format';
import { transactionId } from '../../utils/id';
import MemberAvatar from '../ui/MemberAvatar';

export default function FeeModal() {
  const { feeModalOpen, feeEditTarget, closeFeeModal, showToast, openConfirmModal } = useUiStore();
  const members = useMemberStore(s => s.members);
  const settings = useSettingsStore(s => s.settings);
  const setFee = useFeeStore(s => s.setFee);
  const deleteFee = useFeeStore(s => s.deleteFee);
  const transactions = useTransactionStore(s => s.transactions);
  const setTransactions = useTransactionStore(s => s.setTransactions);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const member = feeEditTarget ? members.find(m => m.id === feeEditTarget.memberId) : null;
  const currentAmt = feeEditTarget ? (useFeeStore.getState().fees[feeEditTarget.year]?.[feeEditTarget.memberId]?.[feeEditTarget.month] || 0) : 0;

  useEffect(() => {
    if (feeModalOpen && feeEditTarget) {
      setAmount(currentAmt > 0 ? currentAmt.toLocaleString() : settings.monthlyFee.toLocaleString());
      const feeRef = `fee_${feeEditTarget.year}_${feeEditTarget.memberId}_${feeEditTarget.month}`;
      const existingTx = transactions.find(t => t.feeRef === feeRef);
      setDate(existingTx?.date || new Date().toISOString().slice(0, 10));
    }
  }, [feeModalOpen, feeEditTarget]);

  const handleSave = () => {
    if (!feeEditTarget) return;
    const val = parseFmt(amount);
    if (val <= 0) { showToast('금액을 입력하세요.'); return; }

    const { memberId, year, month } = feeEditTarget;
    setFee(year, memberId, month, val);

    // Sync to transactions
    const feeRef = `fee_${year}_${memberId}_${month}`;
    const memberName = member?.name || '알수없음';
    const txIdx = transactions.findIndex(t => t.feeRef === feeRef);

    const txData = {
      type: 'deposit' as const,
      amount: val,
      description: `${memberName} ${parseInt(String(month)) + 1}월 회비`,
      category: null,
      feeRef,
      date,
    };

    if (txIdx >= 0) {
      const updated = [...transactions];
      updated[txIdx] = { ...updated[txIdx], ...txData };
      setTransactions(updated);
    } else {
      const newTx = { ...txData, id: transactionId(), eventId: null, createdAt: new Date().toISOString() };
      setTransactions([...transactions, newTx]);
    }

    closeFeeModal();
    showToast('납부 내역이 저장되었습니다');
  };

  const handleDelete = () => {
    if (!feeEditTarget) return;

    openConfirmModal({
      title: '납부 기록 삭제',
      description: `${MONTHS[feeEditTarget.month]} 납부 기록을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      confirmColor: 'red',
      onConfirm: () => {
        const { memberId, year, month } = feeEditTarget;
        deleteFee(year, memberId, month);

        const feeRef = `fee_${year}_${memberId}_${month}`;
        const txIdx = transactions.findIndex(t => t.feeRef === feeRef);
        if (txIdx >= 0) {
          const updated = transactions.filter((_, i) => i !== txIdx);
          setTransactions(updated);
        }

        closeFeeModal();
        showToast('납부 기록이 삭제되었습니다');
      }
    });
  };

  if (!feeEditTarget) return null;

  return (
    <Modal open={feeModalOpen} onClose={closeFeeModal} title={`${member?.name || ''} - ${MONTHS[feeEditTarget.month]} 회비`}>
      <div className="space-y-4">
        {member && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/30">
            <MemberAvatar name={member.name} avatar={member.avatar} size="md" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.name}</p>
              <p className="text-[11px] text-zinc-500">{member.cohort || ''}</p>
            </div>
          </div>
        )}
        <p className="text-[13px] text-zinc-500">{currentAmt > 0 ? '납부 금액을 수정하세요.' : '납부 금액을 입력하세요.'}</p>
        <div>
          <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">금액</label>
          <input
            value={amount}
            onChange={e => setAmount(fmtInputValue(e.target.value))}
            className="input-field text-right"
            placeholder="10,000"
          />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">납부일</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          저장하기
        </button>
        {currentAmt > 0 && (
          <button onClick={handleDelete} className="w-full py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors">
            삭제하기
          </button>
        )}
      </div>
    </Modal>
  );
}
