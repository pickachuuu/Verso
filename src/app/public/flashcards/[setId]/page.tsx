'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Card from '@/component/ui/Card';
import Button from '@/component/ui/Button';
import Header from '@/component/ui/Header';
import { ArrowLeft01Icon, Share01Icon, EyeIcon } from 'hugeicons-react';
import Link from 'next/link';
import { formatMultipleChoiceQuestion } from '@/lib/utils';

const supabase = createClient();

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  total_cards: number;
  user_id: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty_level: number;
}

export default function PublicFlashcardSetPage() {
  const params = useParams();
  const setId = params?.setId as string;

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const fetchPublicSet = async () => {
      if (!setId) return;

      try {
        // Fetch the flashcard set and verify it's public
        const { data: setData, error: setError } = await supabase
          .from('flashcard_sets')
          .select('id, title, description, total_cards, user_id, created_at')
          .eq('id', setId)
          .eq('is_public', true)
          .single();

        if (setError || !setData) {
          setError('Flashcard set not found or not public');
          setLoading(false);
          return;
        }

        setSet(setData);

        // Fetch the flashcards (ordered by position for consistent traversal)
        const { data: cardsData, error: cardsError } = await supabase
          .from('flashcards')
          .select('id, question, answer, difficulty_level')
          .eq('set_id', setId)
          .order('position', { ascending: true });

        if (cardsError) {
          setError('Error loading flashcards');
          setLoading(false);
          return;
        }

        setFlashcards(cardsData || []);
        setLoading(false);
      } catch (err) {
        setError('An error occurred while loading the flashcard set');
        setLoading(false);
      }
    };

    fetchPublicSet();
  }, [setId]);

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/public/flashcards/${setId}`;
    navigator.clipboard.writeText(shareUrl);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-foreground-muted">Loading flashcard set...</p>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="space-y-6">
        <Card variant="elevated" className="text-center py-12">
          <div className="space-y-4">
            <p className="text-foreground-muted">{error || 'This flashcard set is not available for public viewing.'}</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft01Icon className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className='px-2 md:px-12'>
      <div className='flex justify-between item-center my-5'>
        <Link href={`${window.location.origin}/dashboard`}>
          <Header title="MemoForge" />
        </Link>

      </div>
    <div className="space-y-6">

      {/* Set Info */}
      <Card variant="elevated" className="rounded-xl border border-border bg-surface shadow-sm">
        <Card.Header className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{set.title}</h1>
              {set.description && (
                <p className="text-foreground-muted">{set.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-foreground-muted">
                <span>{flashcards.length} cards</span>
                <span>•</span>
                <span>Shared publicly</span>
              </div>
            </div>
            <Button
              onClick={copyShareLink}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Share01Icon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </Card.Header>
      </Card>

      {/* Flashcard Viewer */}
      {flashcards.length > 0 && (
        <Card variant="elevated" className="rounded-xl border border-border bg-surface shadow-sm">
          <Card.Header className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-accent" />
              <h3 className="font-medium">Card {currentCardIndex + 1} of {flashcards.length}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousCard}
                variant="outline"
                size="sm"
                disabled={currentCardIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleNextCard}
                variant="outline"
                size="sm"
                disabled={currentCardIndex === flashcards.length - 1}
              >
                Next
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="space-y-6">
              {/* Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground-muted">Question</label>
                <div className="p-4 bg-accent-muted/10 rounded-lg border border-border">
                  <p className="text-foreground whitespace-pre-line">{formatMultipleChoiceQuestion(currentCard.question)}</p>
                </div>
              </div>

              {/* Answer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground-muted">Answer</label>
                  <Button
                    onClick={handleToggleAnswer}
                    variant="outline"
                    size="sm"
                  >
                    {showAnswer ? 'Hide' : 'Show'} Answer
                  </Button>
                </div>
                {showAnswer && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-foreground">{currentCard.answer}</p>
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground-muted">Difficulty:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentCard.difficulty_level === 1 ? 'bg-green-100 text-green-800' :
                  currentCard.difficulty_level === 2 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentCard.difficulty_level === 1 ? 'Easy' :
                   currentCard.difficulty_level === 2 ? 'Medium' : 'Hard'}
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Empty State */}
      {flashcards.length === 0 && (
        <Card variant="elevated" className="text-center py-12">
          <p className="text-foreground-muted">This flashcard set is empty.</p>
        </Card>
      )}
    </div>
  </div>
  );
}