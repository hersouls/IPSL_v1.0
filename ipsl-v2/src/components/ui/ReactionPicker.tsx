import { useState, useRef, useEffect } from 'react';
import { Smile, Plus } from 'lucide-react';
import type { Reaction } from '../../types';

interface ReactionPickerProps {
    reactions?: Reaction[];
    onToggle: (emoji: string) => void;
    myUserName?: string;
}

const AVAILABLE_EMOJIS = ['👍', '❤️', '😆', '😲', '😢', '👏'];

export default function ReactionPicker({ reactions = [], onToggle, myUserName }: ReactionPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate my reaction to highlight
    const myReactionEmoji = myUserName
        ? reactions.find(r => r.users.includes(myUserName))?.emoji
        : null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Existing Reactions */}
            {reactions.map((r) => {
                const isSelected = myUserName ? r.users.includes(myUserName) : false;
                return (
                    <button
                        key={r.emoji}
                        onClick={() => onToggle(r.emoji)}
                        className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all
              ${isSelected
                                ? 'bg-navy-50/80 border-navy-200 text-navy-700 dark:bg-navy-900/30 dark:border-navy-700 dark:text-navy-300 shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'}
            `}
                        title={r.users.join(', ')}
                    >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                    </button>
                );
            })}

            {/* Add Reaction Button */}
            <div className="relative" ref={pickerRef}>
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all
            bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700
            dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300
          `}
                    title="반응 추가"
                >
                    <Smile className="w-3.5 h-3.5" />
                    <Plus className="w-2.5 h-2.5 -ml-0.5" />
                </button>

                {/* Emoji Picker Popup */}
                {showPicker && (
                    <div className="absolute left-0 bottom-full mb-2 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-2 flex gap-1 animate-fade-in-up">
                        {AVAILABLE_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onToggle(emoji);
                                    setShowPicker(false);
                                }}
                                className={`
                  w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-transform hover:scale-110
                  ${myReactionEmoji === emoji ? 'bg-navy-50 dark:bg-navy-900/30 ring-1 ring-navy-200 dark:ring-navy-700' : ''}
                `}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
