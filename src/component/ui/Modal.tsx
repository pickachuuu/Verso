'use client';

import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
 * Counter-based body scroll lock.
 *
 * Each open modal increments the counter; each closing modal decrements it.
 * Overflow is only restored when the counter reaches 0, so nested modals
 * and race-condition unmounts can never leave the body locked.
 */
let lockCount = 0;

function lockBodyScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

/**
 * Reusable modal component.
 *
 * - Single fixed-inset element guarantees full viewport coverage (no white gaps)
 * - Locks body scroll while open (counter-based, safe for nested modals)
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
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
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

  return createPortal(
    <div
      className={`fixed inset-0 ${nested ? 'z-[120]' : 'z-[100]'} bg-black/40 backdrop-blur-sm overflow-y-auto`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="min-h-full flex items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`relative flex w-full justify-center ${className}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
