import {
  ScrollText, Users, Wallet, HandHeart, FileBarChart, CalendarDays, Vote, Settings, Sun, Moon,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import type { TabId } from '../../types';
import clsx from 'clsx';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'bylaws', label: '회칙', icon: <ScrollText className="w-3.5 h-3.5" /> },
  { id: 'members', label: '회원명부', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'fees', label: '회비관리', icon: <Wallet className="w-3.5 h-3.5" /> },
  { id: 'support', label: '지원관리', icon: <HandHeart className="w-3.5 h-3.5" /> },
  { id: 'statements', label: '회비 내역서', icon: <FileBarChart className="w-3.5 h-3.5" /> },
  { id: 'calendar', label: '캘린더', icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { id: 'voting', label: '투표', icon: <Vote className="w-3.5 h-3.5" /> },
];

export default function TabNav() {
  const currentTab = useUiStore(s => s.currentTab);
  const switchTab = useUiStore(s => s.switchTab);
  const openSettingsModal = useUiStore(s => s.openSettingsModal);
  const isDark = useUiStore(s => s.isDark);
  const toggleDark = useUiStore(s => s.toggleDark);

  return (
    <nav className="sticky top-0 z-50 glass no-print">
      <div className="max-w-4xl mx-auto px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2',
                  currentTab === t.id
                    ? 'tab-active'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={openSettingsModal}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
              title="설정"
            >
              <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
              title="다크모드 전환"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <Sun className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
