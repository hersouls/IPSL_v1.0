import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useEventStore } from '../../stores/eventStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useUiStore } from '../../stores/uiStore';
import { DEFAULT_SETTINGS, STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import { fmtInputValue, parseFmt } from '../../utils/format';
import { exportToJSON, exportAllToExcel, parseImportFile } from '../../services/export';
import * as sync from '../../services/firestoreSync';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

function savePin(pin: string) {
  localStorage.setItem(STORAGE_KEYS.settingsPin, pin);
}

export default function SettingsModal() {
  const { settingsModalOpen, closeSettingsModal, showToast } = useUiStore();
  const settings = useSettingsStore(s => s.settings);
  const setSettings = useSettingsStore(s => s.setSettings);
  const members = useMemberStore(s => s.members);
  const setMembers = useMemberStore(s => s.setMembers);
  const fees = useFeeStore(s => s.fees);
  const setFees = useFeeStore(s => s.setFees);
  const transactions = useTransactionStore(s => s.transactions);
  const setTransactions = useTransactionStore(s => s.setTransactions);
  const events = useEventStore(s => s.events);
  const setEvents = useEventStore(s => s.setEvents);
  const schedules = useScheduleStore(s => s.schedules);
  const setSchedules = useScheduleStore(s => s.setSchedules);
  const fileRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Password change state
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // Settings form state
  const [monthlyFee, setMonthlyFee] = useState('');
  const [condolence, setCondolence] = useState('');
  const [smallGathering, setSmallGathering] = useState('');
  const [smallGatheringCap, setSmallGatheringCap] = useState('');
  const [annualEvent, setAnnualEvent] = useState('');
  const [teachersDay, setTeachersDay] = useState('');

  useEffect(() => {
    if (settingsModalOpen) {
      // Reset auth on every open
      setAuthenticated(false);
      setPinInput('');
      setPinError(false);
      setShowPin(false);
      setNewPin('');
      setNewPinConfirm('');

      setMonthlyFee(settings.monthlyFee.toLocaleString());
      setCondolence(settings.condolence.toLocaleString());
      setSmallGathering(settings.smallGathering.toLocaleString());
      setSmallGatheringCap(settings.smallGatheringCap.toLocaleString());
      setAnnualEvent(settings.annualEvent.toLocaleString());
      setTeachersDay(settings.teachersDay.toLocaleString());

      // Focus pin input after modal animation
      setTimeout(() => pinInputRef.current?.focus(), 100);
    }
  }, [settingsModalOpen]);

  const handlePinSubmit = () => {
    if (pinInput === getPin() || pinInput === MASTER_PIN) {
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      pinInputRef.current?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePinSubmit();
  };

  const handleChangePin = () => {
    if (!newPin.trim()) {
      alert('새 비밀번호를 입력하세요.');
      return;
    }
    if (newPin.length < 4) {
      alert('비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPin !== newPinConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    savePin(newPin);
    setNewPin('');
    setNewPinConfirm('');
    showToast('비밀번호가 변경되었습니다');
  };

  const handleSave = () => {
    setSettings({
      monthlyFee: parseFmt(monthlyFee) || DEFAULT_SETTINGS.monthlyFee,
      condolence: parseFmt(condolence) || DEFAULT_SETTINGS.condolence,
      smallGathering: parseFmt(smallGathering) || DEFAULT_SETTINGS.smallGathering,
      smallGatheringCap: parseFmt(smallGatheringCap) || DEFAULT_SETTINGS.smallGatheringCap,
      annualEvent: parseFmt(annualEvent) || DEFAULT_SETTINGS.annualEvent,
      teachersDay: parseFmt(teachersDay) || DEFAULT_SETTINGS.teachersDay,
    });
    closeSettingsModal();
    showToast('설정이 저장되었습니다');
  };

  const handleExportJSON = () => {
    exportToJSON(settings, members, fees, transactions, events, schedules);
    showToast('JSON 백업 파일이 생성되었습니다');
  };

  const handleExportExcel = () => {
    const year = String(new Date().getFullYear());
    exportAllToExcel(members, fees, transactions, events, year, schedules);
    showToast('Excel 파일이 생성되었습니다');
  };

  const handleImport = async () => {
    if (!fileRef.current?.files?.length) {
      alert('파일을 선택하세요.');
      return;
    }
    if (!confirm('현재 데이터를 백업 파일로 교체합니다. 진행하시겠습니까?')) return;

    try {
      const data = await parseImportFile(fileRef.current.files[0]);
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.members) setMembers(data.members);
      if (data.fees) setFees(data.fees);
      if (data.transactions) setTransactions(data.transactions);
      if (data.events) setEvents(data.events);
      if (data.schedules) setSchedules(data.schedules);
      showToast('데이터가 복원되었습니다');
      closeSettingsModal();
    } catch {
      alert('파일 형식이 올바르지 않습니다.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('정말로 모든 데이터를 삭제하시겠습니까?')) return;

    setSettings({ ...DEFAULT_SETTINGS });
    setMembers([]);
    setFees({});
    setTransactions([]);
    setEvents([]);
    setSchedules([]);

    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.darkMode && key !== STORAGE_KEYS.settingsPin) localStorage.removeItem(key);
    });

    sync.clearAll();
    closeSettingsModal();
    showToast('모든 데이터가 삭제되었습니다');
  };

  return (
    <Modal open={settingsModalOpen} onClose={closeSettingsModal} title={authenticated ? '설정' : '비밀번호 확인'}>
      {!authenticated ? (
        /* ── Password Gate ── */
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 dark:bg-navy-950/50 flex items-center justify-center">
              <Lock className="w-7 h-7 text-navy-600 dark:text-navy-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">설정에 접근하려면<br />비밀번호를 입력하세요.</p>
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
          <button onClick={handlePinSubmit} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
            확인
          </button>
        </div>
      ) : (
        /* ── Settings Content ── */
        <div className="space-y-5">
          {/* Amount settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">금액 설정</h3>
            <Field label="월 회비">
              <input value={monthlyFee} onChange={e => setMonthlyFee(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <Field label="경조사 지원금">
              <input value={condolence} onChange={e => setCondolence(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <Field label="소모임 1인당 지원금">
              <input value={smallGathering} onChange={e => setSmallGathering(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <Field label="소모임 연간 상한">
              <input value={smallGatheringCap} onChange={e => setSmallGatheringCap(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <Field label="홈커밍데이 예산">
              <input value={annualEvent} onChange={e => setAnnualEvent(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <Field label="스승의 날 예산">
              <input value={teachersDay} onChange={e => setTeachersDay(fmtInputValue(e.target.value))} className="input-field text-right" />
            </Field>
            <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
              설정 저장
            </button>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* Password change */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">비밀번호 변경</h3>
            <Field label="새 비밀번호">
              <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} className="input-field" placeholder="4자리 이상" autoComplete="new-password" />
            </Field>
            <Field label="비밀번호 확인">
              <input type="password" value={newPinConfirm} onChange={e => setNewPinConfirm(e.target.value)} className="input-field" placeholder="다시 입력" autoComplete="new-password" />
            </Field>
            <button onClick={handleChangePin} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
              비밀번호 변경
            </button>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* Data management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">데이터 관리</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleExportJSON} className="py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                JSON 백업
              </button>
              <button onClick={handleExportExcel} className="py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                Excel 내보내기
              </button>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">데이터 복원 (JSON)</label>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".json" className="input-field flex-1 text-xs" />
                <button onClick={handleImport} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-navy-600 text-white hover:bg-navy-700 transition-colors whitespace-nowrap">
                  복원
                </button>
              </div>
            </div>
            <button onClick={handleClearAll} className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800">
              전체 데이터 삭제
            </button>
          </div>
        </div>
      )}
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
