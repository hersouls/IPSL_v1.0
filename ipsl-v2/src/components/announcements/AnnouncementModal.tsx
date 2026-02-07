import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { useUiStore } from '../../stores/uiStore';

export default function AnnouncementModal() {
  const { announcementModalOpen, editAnnouncementId, closeAnnouncementModal, showToast } = useUiStore();
  const announcements = useAnnouncementStore(s => s.announcements);
  const addAnnouncement = useAnnouncementStore(s => s.addAnnouncement);
  const updateAnnouncement = useAnnouncementStore(s => s.updateAnnouncement);

  const existing = editAnnouncementId ? announcements.find(a => a.id === editAnnouncementId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (announcementModalOpen) {
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setAuthor(existing.author);
        setPinned(existing.pinned);
      } else {
        setTitle('');
        setContent('');
        setAuthor('');
        setPinned(false);
      }
    }
  }, [announcementModalOpen, editAnnouncementId]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) { alert('제목을 입력하세요.'); return; }

    if (isEdit && editAnnouncementId) {
      updateAnnouncement(editAnnouncementId, {
        title: trimmed,
        content: content.trim(),
        author: author.trim(),
        pinned,
      });
      showToast('공지가 수정되었습니다');
    } else {
      addAnnouncement({
        title: trimmed,
        content: content.trim(),
        author: author.trim(),
        pinned,
      });
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

        <Field label="작성자">
          <input value={author} onChange={e => setAuthor(e.target.value)} className="input-field" placeholder="작성자 이름" />
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
