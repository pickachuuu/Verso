'use client';

import { useState } from 'react';
import { ClayCard } from '@/component/ui/Clay';
import Modal from '@/component/ui/Modal';
import { Delete01Icon } from 'hugeicons-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemName: string;
  itemType: 'note' | 'notebook' | 'flashcard set';
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  loading = false,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting && !loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md">
        <div className="bg-surface border-[3px] border-foreground rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative paper-texture">
          <div className="p-8 text-center bg-background-muted/20 border-b-[3px] border-foreground/5">
            <div className="mx-auto mb-6 w-16 h-16 bg-red-500/10 border-2 border-red-500/20 rounded-full flex items-center justify-center shadow-sm">
              <Delete01Icon className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-foreground-muted font-medium">
              {description}
            </p>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="p-5 bg-surface rounded-[1.5rem] border-2 border-border/60 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-foreground opacity-30" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                  {itemType === 'note' ? 'NOTE' : itemType === 'notebook' ? 'NOTEBOOK' : 'FLASHCARD SET'}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1 line-clamp-2 leading-tight">
                {itemName}
              </p>
            </div>

            <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-start gap-3">
              <Delete01Icon className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-red-700 leading-snug">
                This action cannot be undone. The {itemType} and all associated data will be permanently deleted.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-center">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide">{error}</p>
              </div>
            )}
          </div>

          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting || loading}
              className="flex-1 px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting || loading}
              className="flex-[2] px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting || loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>DELETE {itemType === 'note' ? 'NOTE' : itemType === 'notebook' ? 'NOTEBOOK' : 'SET'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
