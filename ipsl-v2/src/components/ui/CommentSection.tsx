import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ChevronDown, Lock } from 'lucide-react';
import type { Comment, Member } from '../../types';
import { MASTER_PIN } from '../../constants';
import MemberAvatar from './MemberAvatar';

interface MemberOption {
    name: string;
    avatar?: string;
}

interface CommentSectionProps {
    comments?: Comment[];
    memberNames?: string[];
    members?: MemberOption[];
    onAddComment: (comment: { author: string; password: string; content: string }) => void;
    onDeleteComment: (commentId: string) => void;
    isDark?: boolean;
}

export default function CommentSection({ comments = [], members = [], memberNames = [], onAddComment, onDeleteComment, isDark = false }: CommentSectionProps) {
    const [author, setAuthor] = useState('');
    const [password, setPassword] = useState('');
    const [content, setContent] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Derive member list: prefer members prop, fallback to memberNames
    const memberList: MemberOption[] = members.length > 0
        ? members
        : memberNames.map(n => ({ name: n }));

    const selectedMember = memberList.find(m => m.name === author);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!author.trim() || !password.trim() || !content.trim()) return;

        onAddComment({ author, password, content });
        setAuthor('');
        setPassword('');
        setContent('');
    };

    const handleDelete = (comment: Comment) => {
        if (deleteId === comment.id) {
            // Trying to convert to confirm
            if (deletePassword === comment.password || deletePassword === MASTER_PIN) {
                onDeleteComment(comment.id);
                setDeleteId(null);
                setDeletePassword('');
                setError('');
            } else {
                setError('비밀번호가 일치하지 않습니다.');
            }
        } else {
            setDeleteId(comment.id);
            setDeletePassword('');
            setError('');
        }
    };

    return (
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-100'}`}>
            <h5 className={`text-sm font-bold mb-3 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                댓글 <span className="text-navy-600 dark:text-navy-400">{comments.length}</span>
            </h5>

            {/* Comment List */}
            <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'} text-xs`}>
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const cm = memberList.find(m => m.name === comment.author);
                                    return <MemberAvatar name={comment.author} avatar={cm?.avatar} size="xs" />;
                                })()}
                                <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{comment.author}</span>
                                <span className="text-zinc-400 text-[10px]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(comment)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} whitespace-pre-wrap`}>{comment.content}</p>

                        {/* Delete Confirmation Input */}
                        {deleteId === comment.id && (
                            <div className="mt-2 flex items-center gap-2 animate-fade-in">
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="비밀번호"
                                    className={`px-2 py-1 rounded border ${error ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600'} bg-white dark:bg-zinc-800 text-xs w-24`}
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleDelete(comment)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                                >
                                    확인
                                </button>
                                <button
                                    onClick={() => { setDeleteId(null); setError(''); }}
                                    className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded text-xs hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                >
                                    취소
                                </button>
                            </div>
                        )}
                        {deleteId === comment.id && error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
                    </div>
                ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className={`p-3 rounded-xl border ${isDark ? 'border-zinc-700 bg-zinc-900/30' : 'border-zinc-200 bg-white'}`}>
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-1" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs border text-left ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-50'} ${!author ? 'text-zinc-400' : isDark ? 'text-zinc-200' : 'text-zinc-700'}`}
                        >
                            {selectedMember ? (
                                <>
                                    {selectedMember.avatar ? (
                                        <img src={selectedMember.avatar} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-md bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-[9px] font-bold text-navy-600 dark:text-navy-400 flex-shrink-0">
                                            {selectedMember.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="truncate flex-1">{selectedMember.name}</span>
                                </>
                            ) : (
                                <span className="flex-1">작성자 선택</span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {dropdownOpen && (
                            <div className={`absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}>
                                {memberList.map(m => (
                                    <button
                                        key={m.name}
                                        type="button"
                                        onClick={() => { setAuthor(m.name); setDropdownOpen(false); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${author === m.name ? 'bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300' : isDark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-50'}`}
                                    >
                                        {m.avatar ? (
                                            <img src={m.avatar} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-md bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-[9px] font-bold text-navy-600 dark:text-navy-400 flex-shrink-0">
                                                {m.name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="truncate">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <input type="hidden" value={author} required />
                    </div>
                    <div className="relative flex-1">
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs border ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-50'}`}
                            required
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className={`flex-1 px-3 py-2 rounded-lg text-xs border ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-50'}`}
                        required
                    />
                    <button
                        type="submit"
                        className="px-3 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
