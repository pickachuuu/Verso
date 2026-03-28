'use client';

import Modal from '@/component/ui/Modal';
import { ClayCard } from '@/component/ui/Clay';
import { FlashcardIcon, ExamIcon, NotebookIcon } from '@/component/icons';

export type StudyMaterialType = 'flashcards' | 'exam';

interface GenerateStudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: StudyMaterialType) => void;
  noteTitle?: string | null;
}

export default function GenerateStudyMaterialModal({
  isOpen,
  onClose,
  onSelect,
  noteTitle,
}: GenerateStudyMaterialModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md">
        <div className="bg-surface border-[3px] border-foreground rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative paper-texture">
          <div className="px-8 py-6 bg-background-muted/20 border-b-[3px] border-foreground/5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1rem] bg-background-muted flex items-center justify-center shadow-lg shadow-black/5 border border-border/40 shrink-0">
                <NotebookIcon className="w-6 h-6 text-foreground-muted" />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-black text-foreground tracking-tight truncate">Generate</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1 truncate">
                  {noteTitle ? `From "${noteTitle}"` : 'Choose what to create'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4 flex-1">
            <button
              type="button"
              onClick={() => onSelect('flashcards')}
              className="w-full text-left p-5 rounded-[1.5rem] border-2 border-border/60 bg-surface hover:bg-background-muted active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-[1rem] bg-primary/10 border-2 border-primary/20 shrink-0 group-hover:scale-110 transition-transform">
                  <FlashcardIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-tight tracking-tight">Create flashcards</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1">Generate a study set from this notebook</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect('exam')}
              className="w-full text-left p-5 rounded-[1.5rem] border-2 border-border/60 bg-surface hover:bg-background-muted active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-[1rem] bg-secondary/10 border-2 border-secondary/20 shrink-0 group-hover:scale-110 transition-transform">
                  <ExamIcon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-tight tracking-tight">Create an exam</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1">Generate practice questions</p>
                </div>
              </div>
            </button>
          </div>

          <div className="px-8 py-6 bg-surface border-t border-border/40 flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase border-2 border-border/60 hover:bg-background-muted transition-all text-foreground flex items-center justify-center gap-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
