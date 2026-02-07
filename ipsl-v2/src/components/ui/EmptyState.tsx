import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = '데이터가 없습니다.' }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-400 dark:text-zinc-500">{message}</p>
    </div>
  );
}
