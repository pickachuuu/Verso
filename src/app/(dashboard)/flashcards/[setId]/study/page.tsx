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
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-background-muted border border-border/40 rounded-xl" />
            <div className="h-6 w-48 bg-background-muted border border-border/40 rounded-lg" />
          </div>
          <div className="h-2 bg-background-muted border border-border/40 rounded-full" />
          <ClayCard variant="default" padding="lg" className="rounded-2xl">
            <div className="space-y-4">
              <div className="h-4 w-20 bg-background-muted border border-border/40 rounded" />
              <div className="h-6 w-3/4 bg-background-muted border border-border/40 rounded" />
              <div className="h-6 w-1/2 bg-background-muted border border-border/40 rounded" />
            </div>
          </ClayCard>
          <div className="h-14 bg-background-muted border border-border/40 rounded-2xl" />
        </div>
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
  //  MAIN STUDY VIEW
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
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={handleBackToSet}
              className="p-2.5 rounded-xl bg-background-muted border border-border hover:bg-background-muted/70 transition-all flex-shrink-0"
              title="Back to set"
            >
              <ArrowLeft01Icon className="w-4 h-4 text-foreground-muted" />
            </button>
            <div className="p-3 rounded-2xl bg-background-muted border border-border">
              <FlashcardIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Study session</p>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{setTitle}</h1>
              <p className="text-sm text-foreground-muted mt-1">
                Card {currentIndex + 1} of {dueCards.length} due
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background-muted border border-border text-foreground">
              Study Mode
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background-muted border border-border text-foreground-muted">
              Due {dueCards.length}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background-muted border border-border text-foreground-muted">
              Accuracy {liveAccuracyLabel}
            </span>
          </div>
        </div>
      </ClayCard>

      {/* Study stage */}
      {currentCard && (
        <ClayCard variant="default" padding="none" className="rounded-[32px] overflow-hidden">
          <div className="grid lg:grid-cols-[240px_1fr]">
            <aside className="bg-background-muted/60 border-r border-border/60 p-6 flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Session progress</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
                    <span>{reviewedCount} reviewed</span>
                    <span>{remainingCount} left</span>
                  </div>
                  <div className="h-2 rounded-full bg-background-muted overflow-hidden border border-border/30">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-surface/80 px-2 py-3 text-center">
                      <p className="text-base font-semibold text-foreground">{progressPercent}%</p>
                      <p className="text-[10px] text-foreground-muted">Progress</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface/80 px-2 py-3 text-center">
                      <p className="text-base font-semibold text-foreground">{liveAccuracyLabel}</p>
                      <p className="text-[10px] text-foreground-muted">Accuracy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Session stats</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Reviewed</span>
                    <span className="font-semibold text-foreground">{cardsStudiedRef.current}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Correct</span>
                    <span className="font-semibold text-foreground">{correctAnswersRef.current}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Remaining</span>
                    <span className="font-semibold text-foreground">{remainingCount}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Shortcuts</p>
                <div className="mt-3 space-y-2 text-xs text-foreground-muted">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-background-muted border border-border/30 text-foreground-muted/70">
                      Space
                    </kbd>
                    <span>Reveal answer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-background-muted border border-border/30 text-foreground-muted/70">
                      1-4
                    </kbd>
                    <span>Rate difficulty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-background-muted border border-border/30 text-foreground-muted/70">
                      Esc
                    </kbd>
                    <span>Exit session</span>
                  </div>
                </div>
              </div>
            </aside>

            <section className="p-6 md:p-8 flex flex-col min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground-muted/70">
                      Question
                    </span>
                    <span className="px-2 py-1 rounded-full bg-background-muted border border-border text-[10px] font-semibold text-foreground-muted">
                      {currentIndex + 1}/{dueCards.length}
                    </span>
                  </div>
                  <span className="text-xs text-foreground-muted">{remainingCount} left</span>
                </div>
                <div className="text-xl md:text-2xl text-foreground leading-relaxed whitespace-pre-line font-semibold">
                  {currentCard.question}
                </div>
              </div>

              {showAnswer ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-border bg-background-muted/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-primary/70">
                        Answer
                      </span>
                    </div>
                    <div className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line">
                      {currentCard.answer}
                    </div>
                  </div>

                  {lastReviewResult && (
                    <div
                      className={`p-4 rounded-xl text-center border ${
                        lastReviewResult.wasSuccessful
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-red-500/10 border-red-500/20 text-red-500'
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
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-pencil/40 bg-background-muted/40 p-5 text-sm text-foreground-muted">
                  Take a moment to think it through. Press Space or click the button to reveal.
                </div>
              )}

              <div className="mt-auto pt-6">
                {showAnswer ? (
                  !lastReviewResult && (
                    <div className="space-y-4">
                      <p className="text-xs text-foreground-muted text-center font-medium">
                        How well did you know this?
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  )
                ) : (
                  <button
                    onClick={handleShowAnswer}
                    className="w-full py-4 rounded-2xl font-semibold text-white bg-primary hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ViewIcon className="w-5 h-5" />
                    Reveal Answer
                    <span className="text-[11px] text-white/70">Space</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        </ClayCard>
      )}
    </div>
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
