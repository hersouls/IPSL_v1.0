import { CheckCircle } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import clsx from 'clsx';

export default function Toast() {
  const { message, visible } = useUiStore(s => s.toast);

  return (
    <div
      className={clsx(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl',
        'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
        'text-sm font-semibold shadow-lg flex items-center gap-2',
        'transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0',
      )}
    >
      <CheckCircle className="w-4 h-4" />
      {message}
    </div>
  );
}
