'use client';

import { useParams, useRouter } from 'next/navigation';
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
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-elevated rounded-xl" />
            <div className="h-6 w-48 bg-surface-elevated rounded-lg" />
          </div>
          <div className="h-2 bg-surface-elevated rounded-full" />
          <ClayCard variant="default" padding="lg" className="rounded-2xl">
            <div className="space-y-4">
              <div className="h-4 w-20 bg-surface-elevated rounded" />
              <div className="h-6 w-3/4 bg-surface-elevated rounded" />
              <div className="h-6 w-1/2 bg-surface-elevated rounded" />
            </div>
          </ClayCard>
          <div className="h-14 bg-surface-elevated rounded-2xl" />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  NO CARDS DUE
  // ═══════════════════════════════════════════
  if (dueCards.length === 0 && !sessionComplete) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <button
          onClick={handleBackToSet}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon className="w-4 h-4" />
          <span className="text-sm font-medium">Back to {setTitle}</span>
        </button>

        <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <CheckmarkCircle01Icon className="w-10 h-10 text-primary-light" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">All Caught Up!</h2>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              No cards are due for review in <span className="text-foreground font-medium">{setTitle}</span>. Check back later or browse your cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBackToSet}
                className="px-6 py-3 rounded-xl font-semibold border border-border/60 bg-surface-elevated/50 hover:bg-surface-elevated text-foreground transition-all"
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
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <button
          onClick={() => router.push('/flashcards')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon className="w-4 h-4" />
          <span className="text-sm font-medium">Back to sets</span>
        </button>

        <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-tr from-primary-light/10 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Award01Icon className="w-10 h-10 text-primary-light" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Session Complete!</h2>
            <p className="text-foreground-muted mb-8">
              You&apos;ve reviewed all due cards in{' '}
              <span className="text-foreground font-medium">{setTitle}</span>
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
              <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                <div className="text-2xl font-bold text-primary-light">{cardsStudiedRef.current}</div>
                <div className="text-xs text-foreground-muted mt-1">Reviewed</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                <div className="text-2xl font-bold text-foreground">{correctAnswersRef.current}</div>
                <div className="text-xs text-foreground-muted mt-1">Correct</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
                <div className="text-xs text-foreground-muted mt-1">Accuracy</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/flashcards')}
                className="px-6 py-3 rounded-xl text-foreground font-semibold border border-border/60 bg-surface-elevated/50 hover:bg-surface-elevated transition-all"
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
  //  MAIN STUDY VIEW
  // ═══════════════════════════════════════════
  const progressPercent =
    dueCards.length > 0 ? Math.round((currentIndex / dueCards.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBackToSet}
            className="p-2 rounded-xl bg-surface-elevated/60 border border-border/30 hover:bg-surface-elevated transition-all flex-shrink-0"
            title="Back to set"
          >
            <ArrowLeft01Icon className="w-4 h-4 text-foreground-muted" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{setTitle}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-foreground-muted">
                Card {currentIndex + 1} of {dueCards.length} due
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs font-medium text-foreground-muted bg-surface-elevated/80 px-3 py-1.5 rounded-lg border border-border/30">
          Study Mode
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-foreground-muted">
            {currentIndex}/{dueCards.length} reviewed
          </span>
          <span className="text-xs font-semibold text-primary-light">{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden relative">
          {/* Question */}
          <div className="p-6 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-muted/60">
                Question
              </span>
            </div>
            <div className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line font-medium">
              {currentCard.question}
            </div>
          </div>

          {/* Answer */}
          {showAnswer && (
            <div className="border-t border-border/40">
              <div className="p-6 bg-surface-elevated/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary-light/70">
                    Answer
                  </span>
                </div>
                <div className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line">
                  {currentCard.answer}
                </div>
              </div>

              {/* Review result feedback */}
              {lastReviewResult && (
                <div
                  className={`mx-6 mb-6 p-4 rounded-xl text-center border ${
                    lastReviewResult.wasSuccessful
                      ? 'bg-primary/10 border-primary/15 text-primary-light'
                      : 'bg-red-500/10 border-red-500/15 text-red-400'
                  }`}
                >
                  <span className="font-semibold">
                    {lastReviewResult.wasSuccessful ? 'Correct!' : 'Keep practicing!'}
                  </span>
                  <span className="ml-2 text-sm opacity-80">
                    Next review in {lastReviewResult.interval}
                  </span>
                </div>
              )}

              {/* Rating buttons (mandatory) */}
              {!lastReviewResult && (
                <div className="px-6 pb-6 space-y-3">
                  <p className="text-xs text-foreground-muted text-center font-medium">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <RatingButton
                      onClick={() => handleReview('again')}
                      disabled={isReviewing}
                      icon={<RepeatIcon className="w-5 h-5" />}
                      label="Again"
                      sublabel={reviewPreviews?.again}
                      color="red"
                      shortcut="1"
                    />
                    <RatingButton
                      onClick={() => handleReview('hard')}
                      disabled={isReviewing}
                      icon={<Clock01Icon className="w-5 h-5" />}
                      label="Hard"
                      sublabel={reviewPreviews?.hard}
                      color="orange"
                      shortcut="2"
                    />
                    <RatingButton
                      onClick={() => handleReview('good')}
                      disabled={isReviewing}
                      icon={<CheckmarkCircle01Icon className="w-5 h-5" />}
                      label="Good"
                      sublabel={reviewPreviews?.good}
                      color="blue"
                      shortcut="3"
                    />
                    <RatingButton
                      onClick={() => handleReview('easy')}
                      disabled={isReviewing}
                      icon={<SparklesIcon className="w-5 h-5" />}
                      label="Easy"
                      sublabel="Mastered"
                      color="indigo"
                      shortcut="4"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reveal button */}
          {!showAnswer && (
            <div className="px-6 pb-6">
              <button
                onClick={handleShowAnswer}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-primary-light hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <ViewIcon className="w-5 h-5" />
                Reveal Answer
              </button>
            </div>
          )}
        </ClayCard>
      )}

      {/* Keyboard hint */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-foreground-muted/50">
        <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">
          Space
        </kbd>
        <span>reveal</span>
        <span className="mx-1">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">
          1-4
        </kbd>
        <span>rate</span>
        <span className="mx-1">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">
          Esc
        </kbd>
        <span>exit</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  Sub-components
// ════════════════════════════════════════════

const RATING_COLORS = {
  red: {
    bg: 'bg-red-500/8',
    border: 'border-red-500/15',
    hoverBg: 'hover:bg-red-500/15',
    hoverBorder: 'hover:border-red-500/25',
    text: 'text-red-400',
    subtext: 'text-red-400/60',
  },
  orange: {
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/15',
    hoverBg: 'hover:bg-orange-500/15',
    hoverBorder: 'hover:border-orange-500/25',
    text: 'text-orange-400',
    subtext: 'text-orange-400/60',
  },
  blue: {
    bg: 'bg-primary/10',
    border: 'border-primary/15',
    hoverBg: 'hover:bg-primary/20',
    hoverBorder: 'hover:border-primary/25',
    text: 'text-primary-light',
    subtext: 'text-primary-light/60',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/15',
    hoverBg: 'hover:bg-indigo-500/20',
    hoverBorder: 'hover:border-indigo-500/25',
    text: 'text-indigo-400',
    subtext: 'text-indigo-400/60',
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
      <kbd className="mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-surface-elevated/80 border border-border/30 text-foreground-muted/50">
        {shortcut}
      </kbd>
    </button>
  );
}
