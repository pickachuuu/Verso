'use client';

import { ReactNode, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes on the modal flex container */
  className?: string;
  /** Use higher z-index tier for nested/stacked modals */
  nested?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  nested = false,
}: ModalProps) {
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 ${nested ? 'z-[10000]' : 'z-[9999]'} flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 ${className}`}
        >
          <Dialog.Content className="outline-none w-full flex justify-center max-h-full" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Modal Dialog</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

