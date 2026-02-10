import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { X, ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useModalHistory } from '../../hooks/useModalHistory';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useModalHistory(open, onClose);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity" />
      <div className="fixed inset-0 flex items-center justify-center sm:p-4">
        <DialogPanel className="w-full h-full sm:h-auto sm:max-w-lg bg-white dark:bg-zinc-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-none">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="sm:hidden -ml-2 p-2 text-zinc-600 dark:text-zinc-300">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors hidden sm:block"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
