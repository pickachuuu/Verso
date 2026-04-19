'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ClayCard } from '@/component/ui/Clay';
import { FlashcardIcon } from '@/component/icons';
import { useFlashcardActions, SimplifiedRating, formatInterval } from '@/hook/useFlashcardActions';
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  RepeatIcon,
  SparklesIcon,
  ViewIcon,
  Award01Icon,
} from 'hugeicons-react';
import { Flashcard } from '@/lib/database.types';
import {
  getOrCreateFlashcardSession,
  completeStudySession,
  incrementSessionStats,
  logCardReview,
} from '@/hooks/useActivityTracking';
import StudySessionView from '@/component/features/StudySessionView';
import VersoLoader from '@/component/ui/VersoLoader';

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;

  // Core state
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewPreviews, setReviewPreviews] = useState<Record<SimplifiedRating, string> | null>(null);
  const [lastReviewResult, setLastReviewResult] = useState<{ interval: string; wasSuccessful: boolean } | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);

  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const cardsStudiedRef = useRef(0);
  const correctAnswersRef = useRef(0);

  const { getDueCardsForSet, reviewFlashcardWithSR, getReviewPreviews, getFlashcardSetById } = useFlashcardActions();

  const currentCard = useMemo(() => {
    if (dueCards.length === 0 || currentIndex >= dueCards.length) return null;
    return dueCards[currentIndex];
  }, [dueCards, currentIndex]);

  // Load due cards
  const loadDueCards = useCallback(async () => {
    if (!setId) return;
    setIsLoading(true);
    try {
      const [cards, setData] = await Promise.all([
        getDueCardsForSet(setId),
        getFlashcardSetById(setId),
      ]);

      setDueCards(cards);
      setSetTitle(setData?.title || 'Flashcards');

      if (!sessionIdRef.current) {
        const sessionId = await getOrCreateFlashcardSession(setId);
        sessionIdRef.current = sessionId;
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setId, getDueCardsForSet, getFlashcardSetById]);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  // Update review previews when card changes
  useEffect(() => {
    if (currentCard) {
      const previews = getReviewPreviews(currentCard);
      setReviewPreviews(previews);
    }
  }, [currentCard, getReviewPreviews]);

  // Complete session on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current && cardsStudiedRef.current > 0) {
        completeStudySession({
          sessionId: sessionIdRef.current,
          cardsStudied: cardsStudiedRef.current,
          correctAnswers: correctAnswersRef.current,
        });
      }
    };
  }, []);

  const handleShowAnswer = useCallback(() => setShowAnswer(true), []);

  const handleReview = useCallback(
    async (rating: SimplifiedRating) => {
      if (!currentCard || isReviewing) return;
      setIsReviewing(true);
      try {
        const result = await reviewFlashcardWithSR(currentCard.id, rating);
        if (result) {
          const isMasteredNow = result.flashcard.status === 'mastered';
          setLastReviewResult({
            interval: isMasteredNow ? 'Mastered!' : result.nextReviewFormatted,
            wasSuccessful: result.wasSuccessful,
          });

          cardsStudiedRef.current += 1;
          if (result.wasSuccessful) correctAnswersRef.current += 1;

          if (sessionIdRef.current) {
            await logCardReview(sessionIdRef.current, currentCard.id, result.wasSuccessful);
            await incrementSessionStats(sessionIdRef.current, 1, result.wasSuccessful);
          }

          // Auto-advance after brief feedback
          setTimeout(() => {
            setLastReviewResult(null);
            setShowAnswer(false);

            if (currentIndex + 1 < dueCards.length) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              // All due cards reviewed
              setSessionComplete(true);

              // Complete the session
              if (sessionIdRef.current && cardsStudiedRef.current > 0) {
                completeStudySession({
                  sessionId: sessionIdRef.current,
                  cardsStudied: cardsStudiedRef.current,
                  correctAnswers: correctAnswersRef.current,
                });
                sessionIdRef.current = null; // Prevent double-complete on unmount
              }
            }
          }, 1200);
        }
      } catch (error) {
        console.error('Error reviewing flashcard:', error);
      } finally {
        setIsReviewing(false);
      }
    },
    [currentCard, isReviewing, reviewFlashcardWithSR, currentIndex, dueCards.length]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (sessionComplete) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showAnswer) setShowAnswer(true);
          break;
        case '1':
          e.preventDefault();
          if (showAnswer && !isReviewing && !lastReviewResult) handleReview('again');
          break;
        case '2':
          e.preventDefault();
          if (showAnswer && !isReviewing && !lastReviewResult) handleReview('hard');
          break;
        case '3':
          e.preventDefault();
          if (showAnswer && !isReviewing && !lastReviewResult) handleReview('good');
          break;
        case '4':
          e.preventDefault();
          if (showAnswer && !isReviewing && !lastReviewResult) handleReview('easy');
          break;
        case 'Escape':
          e.preventDefault();
          router.push(`/flashcards/${setId}`);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, isReviewing, lastReviewResult, handleReview, sessionComplete, router, setId]);

  const handleBackToSet = useCallback(() => router.push(`/flashcards/${setId}`), [router, setId]);

  // ═══════════════════════════════════════════
  //  LOADING STATE
  // ═══════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] h-full w-full">
        <VersoLoader label="Loading study session..." size={80} />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  NO CARDS DUE
  // ═══════════════════════════════════════════
  if (dueCards.length === 0 && !sessionComplete) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <button
          onClick={handleBackToSet}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon className="w-4 h-4" />
          <span className="text-sm font-medium">Back to {setTitle}</span>
        </button>

        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="text-center py-8">
            <Image
              src="/brand/verso-happy-clean.svg"
              alt="Verso mascot celebrating"
              width={100}
              height={100}
              className="mx-auto mb-6 drop-shadow-sm"
            />
            <h2 className="text-3xl font-bold text-foreground mb-2">All Caught Up!</h2>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              No cards are due for review in <span className="text-foreground font-medium">{setTitle}</span>. Check back later or browse your cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBackToSet}
                className="px-6 py-3 rounded-xl font-semibold border border-border/60 bg-surface hover:bg-background-muted text-foreground transition-all"
              >
                Browse Cards
              </button>
              <button
                onClick={() => router.push('/flashcards')}
                className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Back to Sets
              </button>
            </div>
          </div>
        </ClayCard>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  SESSION COMPLETE
  // ═══════════════════════════════════════════
  if (sessionComplete) {
    const accuracy =
      cardsStudiedRef.current > 0
        ? Math.round((correctAnswersRef.current / cardsStudiedRef.current) * 100)
        : 0;

    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <button
          onClick={() => router.push('/flashcards')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon className="w-4 h-4" />
          <span className="text-sm font-medium">Back to sets</span>
        </button>

        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="text-center py-8">
            <Image
              src="/brand/verso-happy-clean.svg"
              alt="Verso mascot celebrating"
              width={100}
              height={100}
              className="mx-auto mb-6 drop-shadow-sm"
            />
            <h2 className="text-3xl font-bold text-foreground mb-2">Session Complete!</h2>
            <p className="text-foreground-muted mb-8">
              You&apos;ve reviewed all due cards in{' '}
              <span className="text-foreground font-medium">{setTitle}</span>
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
              <div className="p-4 rounded-2xl bg-background-muted border border-border">
                <div className="text-2xl font-bold text-primary-light">{cardsStudiedRef.current}</div>
                <div className="text-xs text-foreground-muted mt-1">Reviewed</div>
              </div>
              <div className="p-4 rounded-2xl bg-background-muted border border-border">
                <div className="text-2xl font-bold text-foreground">{correctAnswersRef.current}</div>
                <div className="text-xs text-foreground-muted mt-1">Correct</div>
              </div>
              <div className="p-4 rounded-2xl bg-background-muted border border-border">
                <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
                <div className="text-xs text-foreground-muted mt-1">Accuracy</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/flashcards')}
                className="px-6 py-3 rounded-xl text-foreground font-semibold border border-border/60 bg-surface hover:bg-background-muted transition-all"
              >
                Back to Sets
              </button>
              <button
                onClick={handleBackToSet}
                className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Browse Cards
              </button>
            </div>
          </div>
        </ClayCard>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════
  const progressPercent =
    dueCards.length > 0 ? Math.round((currentIndex / dueCards.length) * 100) : 0;
  const reviewedCount = currentIndex;
  const remainingCount = Math.max(dueCards.length - currentIndex, 0);
  const liveAccuracy =
    cardsStudiedRef.current > 0
      ? Math.round((correctAnswersRef.current / cardsStudiedRef.current) * 100)
      : 0;
  const liveAccuracyLabel = cardsStudiedRef.current > 0 ? `${liveAccuracy}%` : '--';

  return (
    <StudySessionView
      currentCard={currentCard}
      currentIndex={currentIndex}
      totalCards={dueCards.length}
      progressPercent={progressPercent}
      liveAccuracyLabel={liveAccuracyLabel}
      remainingCount={remainingCount}
      showAnswer={showAnswer}
      onShowAnswer={handleShowAnswer}
      onReview={handleReview}
      isReviewing={isReviewing}
      lastReviewResult={lastReviewResult}
      setTitle={setTitle}
      onBack={handleBackToSet}
    />
  );
}

// ════════════════════════════════════════════
//  Sub-components
// ════════════════════════════════════════════

const RATING_COLORS = {
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    hoverBg: 'hover:bg-red-500/15',
    hoverBorder: 'hover:border-red-500/30',
    text: 'text-red-500',
    subtext: 'text-red-500/70',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    hoverBg: 'hover:bg-orange-500/15',
    hoverBorder: 'hover:border-orange-500/30',
    text: 'text-orange-500',
    subtext: 'text-orange-500/70',
  },
  blue: {
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    hoverBg: 'hover:bg-primary/15',
    hoverBorder: 'hover:border-primary/30',
    text: 'text-primary',
    subtext: 'text-primary/70',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
    hoverBg: 'hover:bg-indigo-500/15',
    hoverBorder: 'hover:border-indigo-500/30',
    text: 'text-indigo-500',
    subtext: 'text-indigo-500/70',
  },
};

function RatingButton({
  onClick,
  disabled,
  icon,
  label,
  sublabel,
  color,
  shortcut,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: keyof typeof RATING_COLORS;
  shortcut: string;
}) {
  const c = RATING_COLORS[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-3 rounded-xl border transition-all disabled:opacity-40 ${c.bg} ${c.border} ${c.hoverBg} ${c.hoverBorder}`}
    >
      <div className={c.text}>{icon}</div>
      <span className={`text-xs font-semibold mt-1.5 ${c.text}`}>{label}</span>
      {sublabel && <span className={`text-[10px] mt-0.5 ${c.subtext}`}>{sublabel}</span>}
      <kbd className="mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-background-muted border border-border/30 text-foreground-muted/60">
        {shortcut}
      </kbd>
    </button>
  );
}
