'use client';

import Header from '@/component/ui/Header';
import { ClayCard, ClayButton, ClayBadge } from '@/component/ui/Clay';
import CreateNoteButton from '@/component/features/CreateNoteButton';
import { File01Icon, Delete01Icon, GoogleGeminiIcon, BookOpen01Icon, ArrowRight01Icon, Clock01Icon } from 'hugeicons-react';
import { useEffect, useState } from 'react';
import { useNoteActions } from '@/hook/useNoteActions';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import GenerateFlashCardModal from '@/component/features/modal/GenerateFlashCardModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { GeminiResponse } from '@/lib/gemini';

const supabase = createClient();

export default function NotesPage() {
  const { getUserNotes, deleteNote } = useNoteActions();
  const { saveGeneratedFlashcards } = useFlashcardActions();
  const [notes, setNotes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const params = useParams();
  const noteId = params?.noteId as string | undefined;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth error:', error);
          window.location.href = '/auth';
          return;
        }

        if (!session) {
          window.location.href = '/auth';
          return;
        }

        const data = await getUserNotes();
        setNotes(data);
        setLoading(false);
      } catch (error) {
        console.error('Error in checkAuth:', error);
        window.location.href = '/auth';
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotes = notes.filter(
    (note) =>
      (note.title && note.title.trim() !== '') ||
      (note.content && note.content.trim() !== '') ||
      (Array.isArray(note.tags) && note.tags.length > 0)
  );

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId) {
        const { data, error } = await supabase
          .from('notes')
          .select('title, content, tags')
          .eq('id', noteId)
          .single();
        if (data) {
          const updatedNotes = notes.map((note) =>
            note.id === noteId ? { ...note, title: data.title, content: data.content, tags: data.tags } : note
          );
          setNotes(updatedNotes);
        }
      }
    };
    fetchNote();
  }, [noteId, notes]);

  const handleGenerateFlashcards = (note: any) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = (note: any) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNote) return;

    try {
      await deleteNote(selectedNote.id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== selectedNote.id));
      setSaveSuccess('Note deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting note:', error);
      setSaveSuccess('Error deleting note. Please try again.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse) => {
    if (!selectedNote) return;

    setSaving(true);
    setSaveSuccess(null);
    try {
      const difficulty = geminiResponse.flashcards[0]?.difficulty || 'medium';
      const setId = await saveGeneratedFlashcards({
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Notes"
          description="Organize and manage your study notes"
          icon={<File01Icon className="w-6 h-6 text-accent" />}
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-6 w-2/3 bg-background-muted rounded-lg" />
                    <div className="h-8 w-8 bg-background-muted rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-background-muted rounded-full" />
                    <div className="h-6 w-12 bg-background-muted rounded-full" />
                  </div>
                </div>
                <div className="px-5 py-4 bg-background-muted/30 flex justify-between">
                  <div className="h-4 w-24 bg-background-muted rounded" />
                  <div className="h-8 w-20 bg-background-muted rounded-lg" />
                </div>
              </ClayCard>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <ClayCard variant="elevated" padding="lg" className="rounded-2xl">
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-6">
                <BookOpen01Icon className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No notes yet</h3>
              <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
                Create your first note to start organizing your study materials
              </p>
              <CreateNoteButton />
            </div>
          </ClayCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <Link href={`/notes/${note.slug || note.id}`} key={note.id} className="block group">
                <ClayCard
                  variant="default"
                  padding="none"
                  className="rounded-2xl overflow-hidden h-full flex flex-col hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <div className="p-2 rounded-xl bg-accent-muted shrink-0">
                        <File01Icon className="w-5 h-5 text-accent" />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {(note.tags || []).slice(0, 3).map((tag: string) => (
                        <ClayBadge key={tag} variant="accent" className="text-xs px-2 py-1">
                          {tag}
                        </ClayBadge>
                      ))}
                      {(note.tags || []).length > 3 && (
                        <span className="text-xs text-foreground-muted px-2 py-1">
                          +{note.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-4 bg-background-muted/30 flex items-center justify-between gap-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <Clock01Icon className="w-3.5 h-3.5" />
                      <span>{note.updated_at ? formatDate(note.updated_at) : 'Never'}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-lg bg-accent-muted hover:bg-accent text-accent hover:text-white transition-all duration-200"
                        title="Generate flashcards"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleGenerateFlashcards(note);
                        }}
                      >
                        <GoogleGeminiIcon className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-200"
                        title="Delete note"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteNote(note);
                        }}
                      >
                        <Delete01Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </ClayCard>
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
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        itemName={selectedNote?.title || 'Untitled Note'}
        itemType="note"
      />
    </>
  );
}
