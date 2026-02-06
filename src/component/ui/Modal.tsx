'use client';

import { useEffect, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes on the modal content wrapper */
  className?: string;
  /** Use higher z-index tier for nested/stacked modals */
  nested?: boolean;
}

/**
 * Reusable modal component.
 *
 * - Single fixed-inset element guarantees full viewport coverage (no white gaps)
 * - Locks body scroll while open
 * - ESC key closes the modal
 * - Clicking the backdrop (outside modal content) closes the modal
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  nested = false,
}: ModalProps) {
  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${nested ? 'z-[120]' : 'z-[100]'} bg-black/40 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
