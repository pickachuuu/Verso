'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/component/ui/Header';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { BookOpen01Icon, Target01Icon, RefreshIcon, File01Icon, Share01Icon, Delete01Icon, ArrowRight01Icon, Clock01Icon } from 'hugeicons-react';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import { FlashcardSet } from '@/lib/database.types';
import ReforgeModal from '@/component/features/modal/ReforgeModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { GeminiResponse } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function FlashcardDashboardPage() {
  const router = useRouter();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReforgeModalOpen, setIsReforgeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [existingFlashcards, setExistingFlashcards] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | undefined>(undefined);
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);
  const { getUserFlashcardSets, getSetProgress, getFirstCardInSet, saveGeneratedFlashcards, deleteFlashcardSet, reforgeFlashcards, togglePublicStatus } = useFlashcardActions();

  const loadFlashcardSets = useCallback(async () => {
    setIsLoading(true);
    try {
      const sets = await getUserFlashcardSets();
      setFlashcardSets(sets);
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserFlashcardSets]);

  useEffect(() => {
    loadFlashcardSets();
  }, [loadFlashcardSets]);

  const handleCardClick = useCallback(async (setId: string) => {
    try {
      const firstCard = await getFirstCardInSet(setId);
      if (firstCard) {
        router.push(`/flashcards/${firstCard.id}`);
      }
    } catch (error) {
      console.error('Error navigating to first card:', error);
    }
  }, [getFirstCardInSet, router]);

  const handleReforgeFlashcards = async (set: FlashcardSet) => {
    setSelectedSet(set);

    try {
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', set.id);

      if (error) {
        console.error('Error fetching existing flashcards:', error);
        setExistingFlashcards([]);
      } else {
        setExistingFlashcards(flashcards || []);
      }
    } catch (error) {
      console.error('Error fetching existing flashcards:', error);
      setExistingFlashcards([]);
    }

    setIsReforgeModalOpen(true);
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse, action: 'add_more' | 'regenerate') => {
    if (!selectedSet) return;

    setSaving(true);
    setSaveSuccess(undefined);
    try {
      await reforgeFlashcards(
        selectedSet.id,
        action,
        geminiResponse.flashcards
      );

      const actionText = action === 'regenerate' ? 'regenerated' : 'added';
      setSaveSuccess(`Successfully ${actionText} ${geminiResponse.flashcards.length} flashcards!`);

      await loadFlashcardSets();
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } catch (error) {
      console.error('Error reforging flashcards:', error);
      setSaveSuccess('Error reforging flashcards. Please try again.');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseReforgeModal = () => {
    setIsReforgeModalOpen(false);
    setSelectedSet(null);
    setExistingFlashcards([]);
  };

  const handleDeleteFlashcardSet = (set: FlashcardSet) => {
    setSelectedSet(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSet) return;

    try {
      await deleteFlashcardSet(selectedSet.id);
      setFlashcardSets(prevSets => prevSets.filter(set => set.id !== selectedSet.id));
      setSaveSuccess('Flashcard set deleted successfully!');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
      setSaveSuccess('Error deleting flashcard set. Please try again.');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    }
  };

  const handleCopyShareLink = async (set: FlashcardSet, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!set.is_public) {
      try {
        await togglePublicStatus(set.id, true);
        setFlashcardSets(prevSets =>
          prevSets.map(s =>
            s.id === set.id ? { ...s, is_public: true } : s
          )
        );
      } catch (error) {
        console.error('Error making set public:', error);
        return;
      }
    }

    const shareUrl = `${window.location.origin}/public/flashcards/${set.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(set.id);
      setTimeout(() => setShareLinkCopied(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header
          title="Flashcards"
          description="Study with interactive flashcards"
          icon={<BookOpen01Icon className="w-6 h-6 text-secondary" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
                  <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="px-5 py-4 bg-gray-50 flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              </div>
            </ClayCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Flashcards"
          description="Study with interactive flashcards"
          icon={<BookOpen01Icon className="w-6 h-6 text-secondary" />}
        >
          <Link href="/notes">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors">
              <File01Icon className="w-4 h-4" />
              Forge from notes
            </button>
          </Link>
        </Header>

        {/* Success/Error Message */}
        {saveSuccess && (
          <ClayCard
            variant="default"
            padding="sm"
            className={`rounded-xl ${
              saveSuccess.includes('Error')
                ? 'border-2 border-red-200 bg-red-50'
                : 'border-2 border-green-200 bg-green-50'
            }`}
          >
            <p className={`text-sm font-medium ${
              saveSuccess.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveSuccess}
            </p>
          </ClayCard>
        )}

        {flashcardSets.length === 0 ? (
          <ClayCard variant="elevated" padding="lg" className="rounded-2xl">
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-secondary-muted flex items-center justify-center mx-auto mb-6">
                <BookOpen01Icon className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No flashcard sets yet</h3>
              <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
                Create flashcards from your notes to start studying
              </p>
              <Link href="/notes">
                <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors">
                  <File01Icon className="w-5 h-5" />
                  Go to Notes
                </button>
              </Link>
            </div>
          </ClayCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {flashcardSets.map((set) => {
              const progress = Math.round((set.mastered_cards / set.total_cards) * 100) || 0;

              return (
                <div
                  key={set.id}
                  className="group cursor-pointer"
                  onClick={() => handleCardClick(set.id)}
                >
                  <ClayCard
                    variant="default"
                    padding="none"
                    className="rounded-2xl overflow-hidden h-full flex flex-col hover:scale-[1.02] transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors truncate">
                              {set.title}
                            </h3>
                            {set.is_public && (
                              <ClayBadge variant="success" className="text-xs px-2 py-0.5 shrink-0">
                                Public
                              </ClayBadge>
                            )}
                          </div>
                          <p className="text-sm text-foreground-muted line-clamp-2">
                            {set.description || 'No description'}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-secondary-muted shrink-0">
                          <BookOpen01Icon className="w-5 h-5 text-secondary" />
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-muted">Progress</span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-secondary to-tertiary h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-foreground-muted">
                              <span className="font-medium text-foreground">{set.total_cards}</span> cards
                            </span>
                            <span className="text-foreground-muted">
                              <span className="font-medium text-green-600">{set.mastered_cards}</span> mastered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-4 bg-gray-50 flex items-center justify-between gap-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                        <Clock01Icon className="w-3.5 h-3.5" />
                        <span>{set.updated_at ? formatDate(set.updated_at) : 'Never'}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            shareLinkCopied === set.id
                              ? 'bg-green-500 text-white'
                              : 'bg-accent-muted hover:bg-accent text-accent hover:text-white'
                          }`}
                          title={shareLinkCopied === set.id ? 'Copied!' : 'Share'}
                          onClick={(e) => handleCopyShareLink(set, e)}
                        >
                          <Share01Icon className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 rounded-lg bg-accent-muted hover:bg-accent text-accent hover:text-white transition-all duration-200"
                          title="Reforge flashcards"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReforgeFlashcards(set);
                          }}
                        >
                          <RefreshIcon className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-200"
                          title="Delete set"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFlashcardSet(set);
                          }}
                        >
                          <Delete01Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </ClayCard>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReforgeModal
        isOpen={isReforgeModalOpen}
        onClose={handleCloseReforgeModal}
        noteContent={selectedSet?.description || ''}
        existingFlashcards={existingFlashcards}
        onFlashcardsGenerated={handleFlashcardsGenerated}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Flashcard Set"
        description="Are you sure you want to delete this flashcard set? This action cannot be undone."
        itemName={selectedSet?.title || 'Untitled Set'}
        itemType="flashcard set"
      />
    </>
  );
}
