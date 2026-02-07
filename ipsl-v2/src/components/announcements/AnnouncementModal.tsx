import { useState, useEffect, useRef } from 'react';
import { Paperclip, X, MapPin, ChevronDown } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import type { AnnouncementAttachment } from '../../types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AnnouncementModal() {
  const { announcementModalOpen, editAnnouncementId, closeAnnouncementModal, showToast } = useUiStore();
  const announcements = useAnnouncementStore(s => s.announcements);
  const addAnnouncement = useAnnouncementStore(s => s.addAnnouncement);
  const updateAnnouncement = useAnnouncementStore(s => s.updateAnnouncement);
  const members = useMemberStore(s => s.members);

  const existing = editAnnouncementId ? announcements.find(a => a.id === editAnnouncementId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [pinned, setPinned] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  useEffect(() => {
    if (announcementModalOpen) {
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setAuthor(existing.author);
        setLocation(existing.location || '');
        setAttachments(existing.attachments || []);
        setPinned(existing.pinned);
      } else {
        setTitle('');
        setContent('');
        setAuthor('');
        setLocation('');
        setAttachments([]);
        setPinned(false);
      }
      setAuthorOpen(false);
    }
  }, [announcementModalOpen, editAnnouncementId]);

  // Close author dropdown on outside click
  useEffect(() => {
    if (!authorOpen) return;
    const handler = (e: MouseEvent) => {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(e.target as Node)) {
        setAuthorOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [authorOpen]);

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" 파일이 2MB를 초과합니다.`);
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      setAttachments(prev => [...prev, { name: file.name, dataUrl }]);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) { alert('제목을 입력하세요.'); return; }

    const data = {
      title: trimmed,
      content: content.trim(),
      author: author.trim(),
      location: location.trim(),
      attachments,
      pinned,
    };

    if (isEdit && editAnnouncementId) {
      updateAnnouncement(editAnnouncementId, data);
      showToast('공지가 수정되었습니다');
    } else {
      addAnnouncement(data);
      showToast('새 공지가 등록되었습니다');
    }
    closeAnnouncementModal();
  };

  return (
    <Modal open={announcementModalOpen} onClose={closeAnnouncementModal} title={isEdit ? '공지 수정' : '새 공지 등록'}>
      <div className="space-y-4">
        <Field label="제목 *">
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="공지 제목을 입력하세요" />
        </Field>

        <Field label="내용">
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input-field" rows={5} placeholder="공지 내용을 입력하세요" />
        </Field>

        <Field label="장소">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={location} onChange={e => setLocation(e.target.value)} className="input-field pl-9" placeholder="장소를 입력하세요" />
          </div>
        </Field>

        <Field label="작성자">
          <div className="relative" ref={authorDropdownRef}>
            <button
              type="button"
              onClick={() => setAuthorOpen(!authorOpen)}
              className="input-field text-left flex items-center justify-between w-full"
            >
              <span className={author ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                {author || '작성자를 선택하세요'}
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${authorOpen ? 'rotate-180' : ''}`} />
            </button>
            {authorOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {sortedMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setAuthor(m.name); setAuthorOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 ${
                      author === m.name ? 'bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400 font-semibold' : ''
                    }`}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-[10px] font-bold text-navy-600 dark:text-navy-400 flex-shrink-0">
                        {(m.name || '?').charAt(0)}
                      </div>
                    )}
                    <span>{m.name}</span>
                    {m.role && <span className="text-[10px] text-zinc-400 ml-auto">{m.role}</span>}
                  </button>
                ))}
                {sortedMembers.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-3">등록된 회원이 없습니다</p>
                )}
              </div>
            )}
          </div>
        </Field>

        {/* Attachments */}
        <Field label="첨부파일">
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-navy-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors w-full justify-center"
          >
            <Paperclip className="w-3.5 h-3.5" />
            파일 첨부 (최대 2MB)
          </button>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200 dark:border-zinc-600">
                  <Paperclip className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setPinned(!pinned)}
            className={`relative w-10 h-6 rounded-full transition-colors ${pinned ? 'bg-navy-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pinned ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">상단 고정</span>
        </label>

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
