import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp, MapPin, Link2, StickyNote, Pencil, Trash2, Search, Lock, Eye, EyeOff } from 'lucide-react';
import Pagination from '../ui/Pagination';
import CommentSection from '../ui/CommentSection';
import ReactionPicker from '../ui/ReactionPicker';
import { useBoardPostStore } from '../../stores/boardPostStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { STORAGE_KEYS, DEFAULT_SETTINGS_PIN, MASTER_PIN } from '../../constants';
import type { BoardPost, Member } from '../../types';
import EmptyState from '../ui/EmptyState';

function getPin(): string {
  return localStorage.getItem(STORAGE_KEYS.settingsPin) || DEFAULT_SETTINGS_PIN;
}

export default function BoardPanel() {
  const boardPosts = useBoardPostStore(s => s.boardPosts);
  const deleteBoardPost = useBoardPostStore(s => s.deleteBoardPost);
  const addComment = useBoardPostStore(s => s.addComment);
  const deleteComment = useBoardPostStore(s => s.deleteComment);
  const toggleReaction = useBoardPostStore(s => s.toggleReaction);
  const members = useMemberStore(s => s.members);
  const { openBoardPostModal, showToast, openConfirmModal } = useUiStore();

  // PIN dialog
  const [pinAction, setPinAction] = useState<{ type: 'create' | 'edit' | 'delete'; id?: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const sorted = [...boardPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filtered = sorted.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (p.author || '').toLowerCase().includes(q);
  });

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);

  const paginatedPosts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
      openBoardPostModal();
    } else if (pinAction.type === 'edit' && pinAction.id) {
      openBoardPostModal(pinAction.id);
    } else if (pinAction.type === 'delete' && pinAction.id) {
      const id = pinAction.id;
      setPinAction(null);
      openConfirmModal({
        title: '게시글 삭제',
        description: '이 게시글을 삭제하시겠습니까?',
        confirmLabel: '삭제',
        confirmColor: 'red',
        onConfirm: () => {
          deleteBoardPost(id);
          showToast('게시글이 삭제되었습니다');
        }
      });
      return;
    }
    setPinAction(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-6 flex-1 w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">게시판</h2>
        <button onClick={() => requestPin('create')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 새 글 작성
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="제목, 내용, 작성자 검색..."
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        />
      </div>

      {filtered.length === 0 && <EmptyState message="등록된 게시글이 없습니다" />}

      <div className="space-y-3">
        {paginatedPosts.map(post => (
          <BoardPostCard
            key={post.id}
            post={post}
            members={members}
            onEdit={() => requestPin('edit', post.id)}
            onDelete={() => requestPin('delete', post.id)}
            onAddComment={(c) => addComment(post.id, c)}
            onDeleteComment={(cid) => deleteComment(post.id, cid)}
            onToggleReaction={(emoji, userName) => toggleReaction(post.id, emoji, userName)}
          />
        ))}
      </div>

      <Pagination
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        className="mt-4"
      />

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

function BoardPostCard({
  post: p,
  members,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment,
  onToggleReaction,
}: {
  post: BoardPost;
  members: Member[];
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (comment: { author: string; password: string; content: string }) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleReaction: (emoji: string, userName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '';
  const rawAuthor = p.author || '';
  const cleanAuthor = rawAuthor.replace(/^(작성자[:\s]*)/, '').trim();
  const authorMember = cleanAuthor ? members.find(m => m.name === cleanAuthor) : null;

  // Simple local storage based user identification for reactions
  const [myUserName, setMyUserName] = useState(() => localStorage.getItem('last_comment_author') || '');

  const handleToggleReaction = (emoji: string) => {
    let name = myUserName;
    if (!name) {
      name = prompt('반응을 남기려면 이름을 입력해주세요:') || '';
      if (name) {
        setMyUserName(name);
        localStorage.setItem('last_comment_author', name);
      }
    }
    if (name) {
      onToggleReaction(emoji, name);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{p.title}</h4>
        <span className="text-[11px] text-zinc-400 flex-shrink-0">{dateStr}</span>
      </div>

      {/* Content preview / expanded */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left">
        {expanded ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap mb-2">{p.content}</p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{p.content || '(내용 없음)'}</p>
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 mb-2">
          {p.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{p.location}</span>
            </div>
          )}
          {p.link && (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-navy-600 dark:text-navy-400 font-semibold hover:underline"
            >
              <Link2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{p.link}</span>
            </a>
          )}
          {p.memo && (
            <div className="flex items-start gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <StickyNote className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap">{p.memo}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {p.author && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                {authorMember?.avatar ? (
                  <img src={authorMember.avatar} alt={cleanAuthor} className="w-5 h-5 rounded-md object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-[9px] font-bold text-navy-600 dark:text-navy-400">
                    {cleanAuthor.charAt(0)}
                  </div>
                )}
                {p.author}
              </span>
            )}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-navy-600 dark:text-navy-400 font-semibold flex items-center gap-0.5 hover:underline"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> 접기</> : <><ChevronDown className="w-3 h-3" /> 더보기</>}
            </button>
          </div>

          {/* Reactions */}
          <ReactionPicker
            reactions={p.reactions}
            onToggle={handleToggleReaction}
            myUserName={myUserName}
          />
        </div>

        <div className="flex items-center gap-1 self-start">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="수정">
            <Pencil className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="삭제">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Comments */}
      {expanded && (
        <CommentSection
          comments={p.comments}
          members={members.map(m => ({ name: m.name, avatar: m.avatar })).sort((a, b) => a.name.localeCompare(b.name))}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      )}
    </div>
  );
}
