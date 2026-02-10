import { useState, useEffect, useRef } from 'react';
import { MapPin, Link2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';
import { useBoardPostStore } from '../../stores/boardPostStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { MASTER_PIN } from '../../constants';

export default function BoardPostModal() {
  const { boardPostModalOpen, editBoardPostId, closeBoardPostModal, showToast } = useUiStore();
  const boardPosts = useBoardPostStore(s => s.boardPosts);
  const addBoardPost = useBoardPostStore(s => s.addBoardPost);
  const updateBoardPost = useBoardPostStore(s => s.updateBoardPost);
  const members = useMemberStore(s => s.members);

  const existing = editBoardPostId ? boardPosts.find(p => p.id === editBoardPostId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [memo, setMemo] = useState('');
  const [authorOpen, setAuthorOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinField, setShowPinField] = useState(false);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  useEffect(() => {
    if (boardPostModalOpen) {
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setAuthor(existing.author);
        setLocation(existing.location || '');
        setLink(existing.link || '');
        setMemo(existing.memo || '');
      } else {
        setTitle('');
        setContent('');
        setAuthor('');
        setLocation('');
        setLink('');
        setMemo('');
      }
      setAuthorOpen(false);
      setPinInput('');
      setPinError(false);
      setShowPinField(false);
    }
  }, [boardPostModalOpen, editBoardPostId]);

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

  const selectedMember = author ? members.find(m => m.name === author) : null;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) { showToast('제목을 입력하세요.'); return; }
    if (!author.trim()) { showToast('작성자를 선택하세요.'); return; }

    // Validate author PIN
    if (selectedMember) {
      const memberPin = selectedMember.pin;
      if (pinInput !== memberPin && pinInput !== MASTER_PIN) {
        setPinError(true);
        return;
      }
    }

    const data = {
      title: trimmed,
      content: content.trim(),
      author: author.trim(),
      location: location.trim(),
      link: link.trim(),
      memo: memo.trim(),
    };

    if (isEdit && editBoardPostId) {
      updateBoardPost(editBoardPostId, data);
      showToast('게시글이 수정되었습니다');
    } else {
      addBoardPost(data);
      showToast('새 게시글이 등록되었습니다');
    }
    closeBoardPostModal();
  };

  return (
    <Modal open={boardPostModalOpen} onClose={closeBoardPostModal} title={isEdit ? '게시글 수정' : '새 글 작성'}>
      <div className="space-y-4">
        <Field label="제목 *">
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="제목을 입력하세요" />
        </Field>

        <Field label="내용">
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input-field" rows={5} placeholder="내용을 입력하세요" />
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
                    onClick={() => { setAuthor(m.name); setAuthorOpen(false); setPinInput(''); setPinError(false); setShowPinField(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 ${author === m.name ? 'bg-navy-50 dark:bg-navy-950/50 text-navy-700 dark:text-navy-400 font-semibold' : ''
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

        {author && (
          <Field label="비밀번호 *">
            <div className="relative">
              <input
                type={showPinField ? 'text' : 'password'}
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                className={`input-field text-center pr-10 tracking-widest ${pinError ? 'border-red-400 dark:border-red-500' : ''}`}
                placeholder={`${author}님의 비밀번호`}
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowPinField(!showPinField)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                {showPinField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && <p className="text-xs text-red-500 mt-1">비밀번호가 올바르지 않습니다.</p>}
          </Field>
        )}

        <Field label="장소">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={location} onChange={e => setLocation(e.target.value)} className="input-field !pl-10" placeholder="장소를 입력하세요" />
          </div>
        </Field>

        <Field label="링크 URL">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={link} onChange={e => setLink(e.target.value)} className="input-field !pl-10" placeholder="https://example.com" type="url" />
          </div>
        </Field>

        <Field label="메모">
          <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input-field" rows={3} placeholder="메모를 입력하세요" />
        </Field>

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
