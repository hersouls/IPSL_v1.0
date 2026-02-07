import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel className="w-full sm:max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700">
            <h3 className="text-base font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
