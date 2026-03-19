'use client';

import Modal from '@/component/ui/Modal';
import { ClayButton, ClayCard } from '@/component/ui/Clay';
import { Bookmark01Icon, File01Icon, Cancel01Icon, Loading01Icon } from 'hugeicons-react';

interface SaveMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'note' | 'flashcard' | 'exam';
  title: string;
  onSaveReference: () => void;
  onSaveCopy: () => void;
  savingAction?: 'reference' | 'copy' | null;
}

const TYPE_LABELS: Record<SaveMaterialModalProps['itemType'], string> = {
  note: 'note',
  flashcard: 'flashcard set',
  exam: 'exam',
};

export default function SaveMaterialModal({
  isOpen,
  onClose,
  itemType,
  title,
  onSaveReference,
  onSaveCopy,
  savingAction = null,
}: SaveMaterialModalProps) {
  const isSaving = savingAction !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg">
        <ClayCard variant="elevated" padding="none" className="rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-8 bg-background-muted/5 border-b border-border/40">
            <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Save {TYPE_LABELS[itemType]}</h2>
            <p className="text-sm font-medium text-foreground-muted">
              Choose how you want to keep <span className="font-black text-foreground">{title}</span>.
            </p>
          </div>

          <div className="p-6 space-y-3 bg-surface">
            <button
              type="button"
              onClick={onSaveReference}
              disabled={isSaving}
              className="w-full text-left p-5 rounded-[1.5rem] border-2 border-border/60 bg-surface hover:bg-background-muted active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-[1rem] bg-background-muted border-2 border-border/60 shrink-0">
                  {savingAction === 'reference' ? (
                    <Loading01Icon className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <Bookmark01Icon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-tight tracking-tight">Save as reference</p>
                  <p className="text-xs font-semibold text-foreground-muted mt-1 leading-snug">
                    Keeps a bookmark to the original in Saved Materials.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onSaveCopy}
              disabled={isSaving}
              className="w-full text-left p-5 rounded-[1.5rem] border-2 border-border/60 bg-surface hover:bg-background-muted active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-[1rem] bg-background-muted border-2 border-border/60 shrink-0">
                  {savingAction === 'copy' ? (
                    <Loading01Icon className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <File01Icon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-tight tracking-tight">Create editable copy</p>
                  <p className="text-xs font-semibold text-foreground-muted mt-1 leading-snug">
                    Adds a personal copy to your Library, Flashcards, or Exams.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="p-6 pt-2 bg-surface flex justify-end">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center gap-2"
            >
              <Cancel01Icon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </ClayCard>
      </div>
    </Modal>
  );
}
