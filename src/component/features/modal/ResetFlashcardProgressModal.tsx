'use client';

import { useState } from 'react';
import Modal from '@/component/ui/Modal';
import { RepeatIcon } from 'hugeicons-react';

export interface ResetFlashcardProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  setTitle: string;
  totalCards?: number;
  loading?: boolean;
}

export default function ResetFlashcardProgressModal({
  isOpen,
  onClose,
  onConfirm,
  setTitle,
  totalCards,
  loading = false,
}: ResetFlashcardProgressModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsResetting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error resetting flashcard progress:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset progress');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting && !loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md">
        <div className="bg-surface border-[3px] border-foreground rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative paper-texture">
          <div className="p-8 text-center bg-background-muted/20 border-b-[3px] border-foreground/5">
            <div className="mx-auto mb-6 w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center shadow-sm">
              <RepeatIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">
              Reset Progress?
            </h3>
            <p className="text-sm text-foreground-muted font-medium">
              This keeps every card, but clears review history and mastery progress so the deck can be studied from the start.
            </p>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="p-5 bg-surface rounded-[1.5rem] border-2 border-border/60 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-foreground opacity-30" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                  FLASHCARD SET
                </span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1 line-clamp-2 leading-tight">
                {setTitle}
              </p>
              {typeof totalCards === 'number' && (
                <p className="text-xs font-bold text-foreground-muted mt-1">
                  {totalCards} {totalCards === 1 ? 'card' : 'cards'} will be reset to new.
                </p>
              )}
            </div>

            <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl flex items-start gap-3">
              <RepeatIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-foreground leading-snug">
                Scheduling, review counts, correct counts, lapses, and mastered status will be cleared.
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
              disabled={isResetting || loading}
              className="flex-1 px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isResetting || loading}
              className="flex-[2] px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase bg-foreground text-surface hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isResetting || loading ? (
                <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Reset Progress</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
