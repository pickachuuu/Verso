'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroActionButton from '../ui/HeroActionButton';
import { NotebookAddIcon } from '@/component/icons';
import Modal from '@/component/ui/Modal';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import { useCreateNote } from '@/hooks/useNotes';
import { Cancel01Icon } from 'hugeicons-react';

export default function CreateNoteButton() {
  const router = useRouter();
  const createNoteMutation = useCreateNote();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [coverColor, setCoverColor] = useState<NotebookColorKey>('royal');
  const [isCreating, setIsCreating] = useState(false);

  const handleOpen = () => {
    setTitle('');
    setCoverColor('royal');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isCreating) return;
    setIsOpen(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || isCreating) return;
    setIsCreating(true);

    try {
      const { slug } = await createNoteMutation.mutateAsync({ title, coverColor });
      setIsOpen(false);
      router.push(`/editor/${slug}`);
    } catch (error) {
      console.error('Error creating notebook:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-[2rem] bg-foreground text-surface hover:bg-foreground/90 transition-all font-black uppercase tracking-[0.2em] text-[13px] shadow-lg active:scale-95`}
      >
        <NotebookAddIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        CREATE NOTEBOOK
      </button>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="relative" style={{ width: 'min(420px, 85vw)', height: 'min(580px, 82vh)' }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-surface-elevated border border-border/50 flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
          >
            <Cancel01Icon className="w-4 h-4 text-foreground-muted" />
          </button>
          <ClayNotebookCover
            mode="editor"
            title={title}
            onTitleChange={setTitle}
            onOpen={handleCreate}
            onColorChange={setCoverColor}
            color={coverColor}
            theme="light"
          />
        </div>
      </Modal>
    </>
  );
}
