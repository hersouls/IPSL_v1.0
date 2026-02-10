import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

export default function ConfirmModal() {
  const { open, title, description, confirmLabel, confirmColor, onConfirm } = useUiStore(s => s.confirmModal);
  const closeConfirmModal = useUiStore(s => s.closeConfirmModal);

  const handleConfirm = () => {
    onConfirm?.();
    closeConfirmModal();
  };

  const btnClass = confirmColor === 'red'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-navy-600 hover:bg-navy-700 text-white';

  return (
    <Dialog open={open} onClose={closeConfirmModal} className="relative z-[110]">
      <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 animate-fade-in">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmColor === 'red' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-navy-50 dark:bg-navy-950/50'}`}>
              <AlertTriangle className={`w-6 h-6 ${confirmColor === 'red' ? 'text-red-600 dark:text-red-400' : 'text-navy-600 dark:text-navy-400'}`} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center whitespace-pre-wrap">{description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={closeConfirmModal}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${btnClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
