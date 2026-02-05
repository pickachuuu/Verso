'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/component/ui/Header';
import { ClayCard } from '@/component/ui/Clay';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import CreateNoteButton from '@/component/features/CreateNoteButton';
import { Book02Icon, BookOpen01Icon } from 'hugeicons-react';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import GenerateFlashCardModal from '@/component/features/modal/GenerateFlashCardModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { GeminiResponse } from '@/lib/gemini';

// TanStack Query hooks
import { useUserNotes, useDeleteNote, Note } from '@/hooks/useNotes';

export default function NotesPage() {
  const { saveGeneratedFlashcards } = useFlashcardActions();

  // TanStack Query for data fetching
  const { data: notes = [], isLoading, error, refetch } = useUserNotes();
  const deleteNoteMutation = useDeleteNote();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Flashcard generation state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filter out empty notes
  const filteredNotes = notes.filter(
    (note) =>
      (note.title && note.title.trim() !== '') ||
      (note.content && note.content.trim() !== '') ||
      (Array.isArray(note.tags) && note.tags.length > 0)
  );

  const handleGenerateFlashcards = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNote) return;

    try {
      await deleteNoteMutation.mutateAsync(selectedNote.id);
      setSaveSuccess('Notebook deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting notebook:', error);
      setSaveSuccess('Error deleting notebook. Please try again.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedNote(null);
    }
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse) => {
    if (!selectedNote) return;

    setSaving(true);
    setSaveSuccess(null);
    try {
      const difficulty = geminiResponse.flashcards[0]?.difficulty || 'medium';
      await saveGeneratedFlashcards({
        noteId: selectedNote.id,
        noteTitle: selectedNote.title,
        difficulty,
        geminiResponse
      });

      setSaveSuccess(`Successfully saved ${geminiResponse.flashcards.length} flashcards!`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      setSaveSuccess('Error saving flashcards. Please try again.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  // Handle auth errors
  if (error) {
    return (
      <div className="space-y-6">
        <Header
          title="Your Notebooks"
          description="Your personal collection of study notebooks"
          icon={<Book02Icon className="w-6 h-6 text-accent" />}
        >
          <CreateNoteButton />
        </Header>
        <ClayCard variant="elevated" padding="lg" className="rounded-2xl">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-2">Error loading notebooks</h3>
            <p className="text-foreground-muted mb-6">
              There was an error loading your notebooks. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </ClayCard>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Your Notebooks"
          description="Your personal collection of study notebooks"
          icon={<Book02Icon className="w-6 h-6 text-accent" />}
        >
          <CreateNoteButton />
        </Header>

        {/* Success/Error Message */}
        {saveSuccess && (
          <ClayCard
            variant="default"
            padding="sm"
            className={`rounded-xl ${
              saveSuccess.includes('Error')
                ? 'border-2 border-red-200 bg-red-50 dark:bg-red-950/20'
                : 'border-2 border-green-200 bg-green-50 dark:bg-green-950/20'
            }`}
          >
            <p className={`text-sm font-medium ${
              saveSuccess.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveSuccess}
            </p>
          </ClayCard>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="notebook-card-skeleton" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <ClayCard variant="elevated" padding="lg" className="rounded-2xl">
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-6">
                <BookOpen01Icon className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No notebooks yet</h3>
              <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
                Create your first notebook to start organizing your study materials
              </p>
              <CreateNoteButton />
            </div>
          </ClayCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNotes.map((note) => (
              <Link href={`/editor/${note.slug || note.id}`} key={note.id} className="block">
                <ClayNotebookCover
                  mode="card"
                  title={note.title}
                  tags={note.tags || []}
                  updatedAt={note.updated_at}
                  color={(note.cover_color as NotebookColorKey) || 'lavender'}
                  onGenerateFlashcards={() => handleGenerateFlashcards(note)}
                  onDelete={() => handleDeleteNote(note)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      <GenerateFlashCardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        noteContent={selectedNote?.content || ''}
        onFlashcardsGenerated={handleFlashcardsGenerated}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Notebook"
        description="Are you sure you want to delete this notebook? This action cannot be undone."
        itemName={selectedNote?.title || 'Untitled Notebook'}
        itemType="notebook"
      />
    </>
  );
}
