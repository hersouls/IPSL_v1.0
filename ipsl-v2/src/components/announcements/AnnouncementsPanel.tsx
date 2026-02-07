import { useState, useRef } from 'react';
import { Plus, Pin, Lock, Eye, EyeOff, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { useUiStore } from '../../stores/uiStore';
import { STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import type { Announcement } from '../../types';
import EmptyState from '../ui/EmptyState';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function AnnouncementsPanel() {
  const announcements = useAnnouncementStore(s => s.announcements);
  const deleteAnnouncement = useAnnouncementStore(s => s.deleteAnnouncement);
  const { openAnnouncementModal, showToast } = useUiStore();

  // PIN dialog
  const [pinAction, setPinAction] = useState<{ type: 'create' | 'edit' | 'delete'; id?: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  // Sort: pinned first, then newest
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const requestPin = (type: 'create' | 'edit' | 'delete', id?: string) => {
    setPinAction({ type, id });
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
      openAnnouncementModal();
    } else if (pinAction.type === 'edit' && pinAction.id) {
      openAnnouncementModal(pinAction.id);
    } else if (pinAction.type === 'delete' && pinAction.id) {
      deleteAnnouncement(pinAction.id);
      showToast('공지가 삭제되었습니다');
    }
    setPinAction(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-6 flex-1 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">공지사항</h2>
        <button onClick={() => requestPin('create')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 새 공지 등록
        </button>
      </div>

      {announcements.length === 0 && <EmptyState message="등록된 공지사항이 없습니다" />}

      {/* List */}
      <div className="space-y-3">
        {sorted.map(a => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            onEdit={() => requestPin('edit', a.id)}
            onDelete={() => requestPin('delete', a.id)}
          />
        ))}
      </div>

      {/* PIN dialog */}
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

function AnnouncementCard({
  announcement: a,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {a.pinned && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
              <Pin className="w-2.5 h-2.5" /> 고정
            </span>
          )}
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{a.title}</h4>
        </div>
        <span className="text-[11px] text-zinc-400 flex-shrink-0">{dateStr}</span>
      </div>

      {/* Content preview / expanded */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        {expanded ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap mb-2">{a.content}</p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{a.content || '(내용 없음)'}</p>
        )}
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {a.author && <span className="text-[11px] text-zinc-400">작성자: {a.author}</span>}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-navy-600 dark:text-navy-400 font-semibold flex items-center gap-0.5 hover:underline"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> 접기</> : <><ChevronDown className="w-3 h-3" /> 더보기</>}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="수정">
            <Pencil className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="삭제">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
