import { Megaphone, CalendarDays, Vote, Cake, Wallet } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import type { NotificationItem } from '../../hooks/useNotifications';
import type { TabId } from '../../types';

const ICON_MAP: Record<string, React.ReactNode> = {
  announcement: <Megaphone className="w-4 h-4 text-navy-600 dark:text-navy-400" />,
  schedule: <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  vote: <Vote className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  birthday: <Cake className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
  fee: <Wallet className="w-4 h-4 text-red-600 dark:text-red-400" />,
};

interface Props {
  notifications: NotificationItem[];
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: Props) {
  const switchTab = useUiStore(s => s.switchTab);

  const handleItemClick = (tab: TabId) => {
    switchTab(tab);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[60]">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">알림</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-zinc-400">
          새로운 알림이 없습니다
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
          {notifications.map((n, i) => (
            <button
              key={`${n.type}-${i}`}
              onClick={() => handleItemClick(n.tab)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <div className="mt-0.5 flex-shrink-0">
                {ICON_MAP[n.type]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {n.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {n.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
