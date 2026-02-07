import { useState, useEffect } from 'react';
import { Users, Presentation, MessageSquare, PartyPopper, CalendarPlus, MapPin } from 'lucide-react';
import Modal from '../ui/Modal';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useUiStore } from '../../stores/uiStore';
import { SCHEDULE_LABELS } from '../../constants';
import type { ScheduleLabel } from '../../types';

const LABEL_ICONS: Record<string, React.ReactNode> = {
  meeting:     <Users className="w-3.5 h-3.5" />,
  workshop:    <Presentation className="w-3.5 h-3.5" />,
  conference:  <MessageSquare className="w-3.5 h-3.5" />,
  anniversary: <PartyPopper className="w-3.5 h-3.5" />,
  custom:      <CalendarPlus className="w-3.5 h-3.5" />,
};

const LABEL_KEYS = Object.keys(SCHEDULE_LABELS) as ScheduleLabel[];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ScheduleModal() {
  const { scheduleModalOpen, editScheduleId, scheduleModalDate, closeScheduleModal, showToast } = useUiStore();
  const calSelectedDate = useUiStore(s => s.calSelectedDate);
  const schedules = useScheduleStore(s => s.schedules);
  const addSchedule = useScheduleStore(s => s.addSchedule);
  const updateSchedule = useScheduleStore(s => s.updateSchedule);
  const deleteSchedule = useScheduleStore(s => s.deleteSchedule);

  const existing = editScheduleId ? schedules.find(s => s.id === editScheduleId) : null;
  const isEdit = !!existing;

  const [label, setLabel] = useState<ScheduleLabel>('meeting');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (scheduleModalOpen) {
      if (existing) {
        setLabel(existing.scheduleLabel);
        setTitle(existing.title);
        setDate(existing.date);
        setStartTime(existing.startTime);
        setEndTime(existing.endTime);
        setLocation(existing.location);
        setMemo(existing.memo);
      } else {
        setLabel('meeting');
        setTitle('');
        setDate(scheduleModalDate || calSelectedDate || todayStr());
        setStartTime('');
        setEndTime('');
        setLocation('');
        setMemo('');
      }
    }
  }, [scheduleModalOpen, editScheduleId]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) { alert('제목을 입력하세요.'); return; }
    if (!date) { alert('날짜를 선택하세요.'); return; }

    const data = {
      title: trimmed,
      date,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      scheduleLabel: label,
      location: location.trim(),
      memo: memo.trim(),
    };

    if (isEdit && editScheduleId) {
      updateSchedule(editScheduleId, data);
      showToast('일정이 수정되었습니다');
    } else {
      addSchedule(data);
      showToast('새 일정이 등록되었습니다');
    }
    closeScheduleModal();
  };

  const handleDelete = () => {
    if (!editScheduleId) return;
    if (!confirm(`"${existing?.title}" 일정을 삭제하시겠습니까?`)) return;
    deleteSchedule(editScheduleId);
    showToast('일정이 삭제되었습니다');
    closeScheduleModal();
  };

  const placeholders: Record<ScheduleLabel, string> = {
    meeting: '정기 모임명',
    workshop: '워크샵명',
    conference: '회의명',
    anniversary: '기념일명',
    custom: '일정명',
  };

  return (
    <Modal open={scheduleModalOpen} onClose={closeScheduleModal} title={isEdit ? '일정 수정' : '새 일정 등록'}>
      <div className="space-y-4">
        {/* Label selector */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {LABEL_KEYS.map(k => {
            const info = SCHEDULE_LABELS[k];
            const active = label === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setLabel(k)}
                className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  active
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-400'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                {LABEL_ICONS[k]}
                <span className="truncate">{info.label}</span>
              </button>
            );
          })}
        </div>

        <Field label="제목 *">
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder={placeholders[label]} />
        </Field>

        <Field label="날짜 *">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 시간">
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" />
          </Field>
          <Field label="종료 시간">
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" />
          </Field>
        </div>

        <Field label="장소">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input value={location} onChange={e => setLocation(e.target.value)} className="input-field pl-9" placeholder="장소를 입력하세요" />
          </div>
        </Field>

        <Field label="메모">
          <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input-field" rows={2} placeholder="추가 메모" />
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
