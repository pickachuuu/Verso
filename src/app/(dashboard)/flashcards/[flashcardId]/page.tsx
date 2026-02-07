'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ClayCard, ClayButton } from "@/component/ui/Clay";
import { FlashcardIcon } from "@/component/icons";
import { useFlashcardActions, SimplifiedRating, formatInterval } from "@/hook/useFlashcardActions";
import {
  Share01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  RepeatIcon,
  SparklesIcon,
  ViewIcon,
  Award01Icon,
  AnalyticsUpIcon,
  ArrowDown01Icon,
} from "hugeicons-react";
import { useTogglePublicStatus, StudySetData } from "@/hooks/useFlashcards";
import {
  getOrCreateFlashcardSession,
  completeStudySession,
  incrementSessionStats,
  logCardReview
} from "@/hooks/useActivityTracking";

export default function FlashcardPage() {
    const params = useParams();
    const router = useRouter();
    const flashcardId = params.flashcardId as string;

    // Core state
    const [studyData, setStudyData] = useState<StudySetData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewPreviews, setReviewPreviews] = useState<Record<SimplifiedRating, string> | null>(null);
    const [lastReviewResult, setLastReviewResult] = useState<{ interval: string; wasSuccessful: boolean } | null>(null);
    const [showStats, setShowStats] = useState(false);

    // Session tracking
    const sessionIdRef = useRef<string | null>(null);
    const cardsStudiedRef = useRef(0);
    const correctAnswersRef = useRef(0);

    // Track cards reviewed in this session
    const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());

    // TanStack Query mutations
    const togglePublicMutation = useTogglePublicStatus();

    // Keep old hook for utility functions
    const { getStudySetData, getFlashcardById, reviewFlashcardWithSR, getReviewPreviews } = useFlashcardActions();

    // Derived state
    const currentCard = useMemo(() => {
        if (!studyData?.cards || currentIndex < 0 || currentIndex >= studyData.cards.length) return null;
        return studyData.cards[currentIndex];
    }, [studyData?.cards, currentIndex]);

    const hasNext = useMemo(() => studyData ? currentIndex < studyData.cards.length - 1 : false, [studyData, currentIndex]);
    const hasPrevious = useMemo(() => currentIndex > 0, [currentIndex]);

    const progress = useMemo(() => {
        if (!studyData?.cards) return { total: 0, mastered: 0, percentage: 0 };
        const masteredCount = studyData.cards.filter(c => c.status === 'mastered').length;
        return {
            total: studyData.cards.length,
            mastered: masteredCount,
            percentage: studyData.cards.length > 0 ? Math.round((masteredCount / studyData.cards.length) * 100) : 0
        };
    }, [studyData?.cards]);

    const unreviewedCards = useMemo(() => {
        if (!studyData?.cards) return [];
        return studyData.cards.filter(c => !reviewedCardIds.has(c.id));
    }, [studyData?.cards, reviewedCardIds]);

    const isCurrentCardReviewed = currentCard ? reviewedCardIds.has(currentCard.id) : false;

    const allCardsReviewedThisSession = studyData?.cards
        ? studyData.cards.length > 0 && unreviewedCards.length === 0
        : false;

    // Load study set data
    const loadStudyData = useCallback(async () => {
        if (!flashcardId) return;
        setIsLoading(true);
        try {
            const flashcard = await getFlashcardById(flashcardId);
            if (!flashcard) { setIsLoading(false); return; }

            const data = await getStudySetData(flashcard.set_id);
            if (data) {
                setStudyData(data);
                const index = data.cards.findIndex(c => c.id === flashcardId);
                setCurrentIndex(index >= 0 ? index : 0);
                if (!sessionIdRef.current) {
                    const sessionId = await getOrCreateFlashcardSession(flashcard.set_id);
                    sessionIdRef.current = sessionId;
                }
            }
        } catch (error) {
            console.error('Error loading study data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [flashcardId, getFlashcardById, getStudySetData]);

    useEffect(() => { loadStudyData(); }, [loadStudyData]);

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

    const handleNextCard = useCallback(() => {
        if (!hasNext) return;
        setShowAnswer(false);
        setCurrentIndex(prev => prev + 1);
        const nextCard = studyData?.cards[currentIndex + 1];
        if (nextCard) window.history.replaceState(null, '', `/flashcards/${nextCard.id}`);
    }, [hasNext, studyData?.cards, currentIndex]);

    const handlePreviousCard = useCallback(() => {
        if (!hasPrevious) return;
        setShowAnswer(false);
        setCurrentIndex(prev => prev - 1);
        const prevCard = studyData?.cards[currentIndex - 1];
        if (prevCard) window.history.replaceState(null, '', `/flashcards/${prevCard.id}`);
    }, [hasPrevious, studyData?.cards, currentIndex]);

    const handleReview = useCallback(async (rating: SimplifiedRating) => {
        if (!currentCard || isReviewing) return;
        setIsReviewing(true);
        try {
            const result = await reviewFlashcardWithSR(currentCard.id, rating);
            if (result) {
                setReviewedCardIds(prev => new Set([...prev, currentCard.id]));
                setStudyData(prev => {
                    if (!prev) return prev;
                    return { ...prev, cards: prev.cards.map(c => c.id === currentCard.id ? result.flashcard : c) };
                });

                const isMasteredNow = result.flashcard.status === 'mastered';
                setLastReviewResult({
                    interval: isMasteredNow ? 'Mastered!' : result.nextReviewFormatted,
                    wasSuccessful: result.wasSuccessful
                });

                cardsStudiedRef.current += 1;
                if (result.wasSuccessful) correctAnswersRef.current += 1;

                if (sessionIdRef.current) {
                    await logCardReview(sessionIdRef.current, currentCard.id, result.wasSuccessful);
                    await incrementSessionStats(sessionIdRef.current, 1, result.wasSuccessful);
                }

                setTimeout(() => {
                    setLastReviewResult(null);
                    const newReviewedIds = new Set([...reviewedCardIds, currentCard.id]);
                    let nextIdx: number | null = null;
                    if (studyData?.cards) {
                        for (let i = currentIndex + 1; i < studyData.cards.length; i++) {
                            if (!newReviewedIds.has(studyData.cards[i].id)) { nextIdx = i; break; }
                        }
                        if (nextIdx === null) {
                            for (let i = 0; i < currentIndex; i++) {
                                if (!newReviewedIds.has(studyData.cards[i].id)) { nextIdx = i; break; }
                            }
                        }
                    }
                    if (nextIdx !== null && studyData?.cards) {
                        setShowAnswer(false);
                        setCurrentIndex(nextIdx);
                        const nextCard = studyData.cards[nextIdx];
                        if (nextCard) window.history.replaceState(null, '', `/flashcards/${nextCard.id}`);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error reviewing flashcard:', error);
        } finally {
            setIsReviewing(false);
        }
    }, [currentCard, isReviewing, reviewFlashcardWithSR, studyData?.cards, currentIndex, reviewedCardIds]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch (e.key) {
                case ' ': case 'Enter': e.preventDefault(); if (!showAnswer) setShowAnswer(true); break;
                case 'ArrowRight': case 'l': e.preventDefault(); if (hasNext) handleNextCard(); break;
                case 'ArrowLeft': case 'h': e.preventDefault(); if (hasPrevious) handlePreviousCard(); break;
                case '1': e.preventDefault(); if (showAnswer && !isReviewing) handleReview('again'); break;
                case '2': e.preventDefault(); if (showAnswer && !isReviewing) handleReview('hard'); break;
                case '3': e.preventDefault(); if (showAnswer && !isReviewing) handleReview('good'); break;
                case '4': e.preventDefault(); if (showAnswer && !isReviewing) handleReview('easy'); break;
                case 'Escape': e.preventDefault(); if (showAnswer) setShowAnswer(false); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAnswer, hasNext, hasPrevious, isReviewing, handleReview, handleNextCard, handlePreviousCard]);

    const handleToggleSharing = useCallback(async () => {
        if (!studyData?.set) return;
        setIsSharing(true);
        try {
            const newPublicStatus = !studyData.set.is_public;
            await togglePublicMutation.mutateAsync({ setId: studyData.set.id, isPublic: newPublicStatus });
            setStudyData(prev => prev ? { ...prev, set: { ...prev.set, is_public: newPublicStatus } } : prev);
        } catch (error) { console.error('Error toggling sharing:', error); }
        finally { setIsSharing(false); }
    }, [studyData?.set, togglePublicMutation]);

    const handleCopyShareLink = useCallback(async () => {
        if (!studyData?.set) return;
        if (!studyData.set.is_public) await handleToggleSharing();
        const shareUrl = `${window.location.origin}/public/flashcards/${studyData.set.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareLinkCopied(true);
            setTimeout(() => setShareLinkCopied(false), 2000);
        } catch (error) { console.error('Error copying to clipboard:', error); }
    }, [studyData?.set, handleToggleSharing]);

    const handleBackToSets = useCallback(() => router.push('/flashcards'), [router]);

    // ═══════════════════════════════════════════════
    //  LOADING STATE
    // ═══════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════
    //  NOT FOUND STATE
    // ═══════════════════════════════════════════════
    if (!currentCard || !studyData) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <ClayCard variant="elevated" padding="lg" className="rounded-3xl text-center">
                    <div className="py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                            <FlashcardIcon className="w-10 h-10 text-primary-light" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Flashcard Not Found</h2>
                        <p className="text-foreground-muted mb-8">The flashcard you&apos;re looking for doesn&apos;t exist.</p>
                        <ClayButton variant="primary" onClick={handleBackToSets}>
                            Back to Flashcard Sets
                        </ClayButton>
                    </div>
                </ClayCard>
            </div>
        );
    }

    const isMastered = currentCard.status === 'mastered';
    const isLearning = currentCard.status === 'learning';

    // ═══════════════════════════════════════════════
    //  SESSION COMPLETE
    // ═══════════════════════════════════════════════
    if (allCardsReviewedThisSession) {
        const masteredCount = studyData.cards.filter(c => c.status === 'mastered').length;
        const accuracy = cardsStudiedRef.current > 0
            ? Math.round((correctAnswersRef.current / cardsStudiedRef.current) * 100)
            : 0;

        return (
            <div className="max-w-3xl mx-auto py-8 space-y-6">
                {/* Back button */}
                <button
                    onClick={handleBackToSets}
                    className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft01Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to sets</span>
                </button>

                <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
                    {/* Background decoration */}
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
                            You&apos;ve reviewed all {studyData.cards.length} cards in <span className="text-foreground font-medium">{studyData.set.title}</span>
                        </p>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
                            <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                                <div className="text-2xl font-bold text-primary-light">{masteredCount}</div>
                                <div className="text-xs text-foreground-muted mt-1">Mastered</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                                <div className="text-2xl font-bold text-foreground">{cardsStudiedRef.current}</div>
                                <div className="text-xs text-foreground-muted mt-1">Studied</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border/30">
                                <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
                                <div className="text-xs text-foreground-muted mt-1">Accuracy</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handleBackToSets}
                                className="px-6 py-3 rounded-xl text-foreground font-semibold border border-border/60 bg-surface-elevated/50 hover:bg-surface-elevated transition-all"
                            >
                                Back to Sets
                            </button>
                            <button
                                onClick={() => {
                                    setReviewedCardIds(new Set());
                                    setCurrentIndex(0);
                                    setShowAnswer(false);
                                    cardsStudiedRef.current = 0;
                                    correctAnswersRef.current = 0;
                                }}
                                className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                            >
                                Study Again
                            </button>
                        </div>
                    </div>
                </ClayCard>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    //  MAIN STUDY VIEW
    // ═══════════════════════════════════════════════
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-5">
            {/* ── Top bar: back, title, share ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={handleBackToSets}
                        className="p-2 rounded-xl bg-surface-elevated/60 border border-border/30 hover:bg-surface-elevated transition-all flex-shrink-0"
                        title="Back to sets"
                    >
                        <ArrowLeft01Icon className="w-4 h-4 text-foreground-muted" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-foreground truncate">
                            {studyData.set.title || "Flashcards"}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-foreground-muted">
                                Card {currentIndex + 1} of {studyData.cards.length}
                            </span>
                            <span className="text-foreground-muted/30">·</span>
                            <span className="text-xs text-foreground-muted">
                                {reviewedCardIds.size} reviewed
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {studyData.set.is_public && (
                        <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary-light bg-primary/10 border border-primary/15 rounded-lg">
                            Public
                        </span>
                    )}
                    <button
                        onClick={handleCopyShareLink}
                        disabled={isSharing}
                        className={`p-2 rounded-xl border transition-all ${
                            shareLinkCopied
                                ? 'bg-primary/15 border-primary/20 text-primary-light'
                                : 'bg-surface-elevated/60 border-border/30 text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
                        }`}
                        title={shareLinkCopied ? 'Copied!' : 'Share'}
                    >
                        <Share01Icon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Progress bar ── */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground-muted">
                        {progress.mastered}/{progress.total} mastered
                    </span>
                    <span className="text-xs font-semibold text-primary-light">{progress.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border/20">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                    />
                </div>
                {/* Card dots */}
                {studyData.cards.length <= 20 && (
                    <div className="flex gap-1 mt-3 justify-center">
                        {studyData.cards.map((card, idx) => {
                            const isReviewed = reviewedCardIds.has(card.id);
                            const isCurrent = idx === currentIndex;
                            return (
                                <button
                                    key={card.id}
                                    onClick={() => {
                                        setCurrentIndex(idx);
                                        setShowAnswer(false);
                                        window.history.replaceState(null, '', `/flashcards/${card.id}`);
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        isCurrent
                                            ? 'w-6 bg-primary-light'
                                            : card.status === 'mastered'
                                                ? 'w-1.5 bg-primary-light/50'
                                                : isReviewed
                                                    ? 'w-1.5 bg-primary/40'
                                                    : 'w-1.5 bg-surface-elevated hover:bg-border'
                                    }`}
                                    title={`Card ${idx + 1}`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Flashcard ── */}
            <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden relative">
                {/* Status badge */}
                {(isMastered || isLearning) && (
                    <div className="absolute top-4 right-4 z-10">
                        {isMastered && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/15 text-primary-light border border-primary/20">
                                <CheckmarkCircle01Icon className="w-3 h-3" />
                                Mastered
                            </span>
                        )}
                        {isLearning && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/15 text-secondary-light border border-secondary/20">
                                Learning
                            </span>
                        )}
                    </div>
                )}

                {/* Question section */}
                <div className="p-6 pb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-muted/60">Question</span>
                    </div>
                    <div className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line font-medium">
                        {currentCard.question}
                    </div>
                </div>

                {/* Answer section */}
                {showAnswer && (
                    <div className="border-t border-border/40">
                        <div className="p-6 bg-surface-elevated/30">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-primary-light/70">Answer</span>
                            </div>
                            <div className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line">
                                {currentCard.answer}
                            </div>
                        </div>

                        {/* Review result feedback */}
                        {lastReviewResult && (
                            <div className={`mx-6 mb-6 p-4 rounded-xl text-center border ${
                                lastReviewResult.wasSuccessful
                                    ? 'bg-primary/10 border-primary/15 text-primary-light'
                                    : 'bg-secondary/10 border-secondary/15 text-secondary-light'
                            }`}>
                                <span className="font-semibold">
                                    {lastReviewResult.wasSuccessful ? 'Correct!' : 'Keep practicing!'}
                                </span>
                                <span className="ml-2 text-sm opacity-80">
                                    Next review in {lastReviewResult.interval}
                                </span>
                            </div>
                        )}

                        {/* Spaced Repetition Rating */}
                        {!lastReviewResult && !isCurrentCardReviewed && (
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

                        {/* Set complete banner */}
                        {!hasNext && !lastReviewResult && (
                            <div className="mx-6 mb-6 p-4 rounded-xl bg-primary/10 border border-primary/15 text-center">
                                <p className="text-primary-light font-semibold text-sm">
                                    You&apos;ve reached the last card!
                                </p>
                                <p className="text-xs text-foreground-muted mt-1">
                                    {progress.mastered}/{progress.total} mastered ({progress.percentage}%)
                                </p>
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

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePreviousCard}
                    disabled={!hasPrevious}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/40 bg-surface-elevated/50 hover:bg-surface-elevated text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ArrowLeft01Icon className="w-4 h-4" />
                    Previous
                </button>

                {/* Keyboard hint */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground-muted/50">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">Space</kbd>
                    <span>reveal</span>
                    <span className="mx-1">·</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">←→</kbd>
                    <span>nav</span>
                    <span className="mx-1">·</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/30 text-foreground-muted/60">1-4</kbd>
                    <span>rate</span>
                </div>

                <button
                    onClick={handleNextCard}
                    disabled={!hasNext}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/40 bg-surface-elevated/50 hover:bg-surface-elevated text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Next
                    <ArrowRight01Icon className="w-4 h-4" />
                </button>
            </div>

            {/* ── Stats toggle ── */}
            <div>
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition-colors w-full justify-center py-2"
                >
                    <AnalyticsUpIcon className="w-3.5 h-3.5" />
                    <span className="font-medium">{showStats ? 'Hide' : 'Show'} Card Statistics</span>
                    <ArrowDown01Icon className={`w-3 h-3 transition-transform ${showStats ? 'rotate-180' : ''}`} />
                </button>

                {showStats && (
                    <ClayCard variant="default" padding="md" className="rounded-2xl mt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCell label="Status" value={currentCard.status} capitalize statusColor={
                                currentCard.status === 'mastered' ? 'text-primary-light' :
                                currentCard.status === 'learning' ? 'text-secondary-light' :
                                currentCard.status === 'review' ? 'text-primary' : 'text-foreground'
                            } />
                            <StatCell label="Ease Factor" value={((currentCard as any).ease_factor || 2.5).toFixed(2)} />
                            <StatCell label="Interval" value={(currentCard as any).interval_days ? formatInterval((currentCard as any).interval_days) : 'New'} />
                            <StatCell label="Repetitions" value={String((currentCard as any).repetitions || 0)} />
                            <StatCell label="Reviews" value={String(currentCard.review_count)} />
                            <StatCell
                                label="Correct"
                                value={`${currentCard.correct_count}${currentCard.review_count > 0 ? ` (${Math.round((currentCard.correct_count / currentCard.review_count) * 100)}%)` : ''}`}
                            />
                            <StatCell label="Lapses" value={String((currentCard as any).lapses || 0)} />
                            <StatCell label="Next Review" value={currentCard.next_review ? new Date(currentCard.next_review).toLocaleDateString() : 'Now'} />
                        </div>
                        {currentCard.last_reviewed && (
                            <p className="text-[10px] text-foreground-muted mt-3 text-center">
                                Last reviewed: {new Date(currentCard.last_reviewed).toLocaleDateString()}
                            </p>
                        )}
                    </ClayCard>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════
//  Sub-components
// ════════════════════════════════════════════════

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
            {sublabel && (
                <span className={`text-[10px] mt-0.5 ${c.subtext}`}>{sublabel}</span>
            )}
            <kbd className="mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-surface-elevated/80 border border-border/30 text-foreground-muted/50">
                {shortcut}
            </kbd>
        </button>
    );
}

function StatCell({
    label,
    value,
    capitalize,
    statusColor,
}: {
    label: string;
    value: string;
    capitalize?: boolean;
    statusColor?: string;
}) {
    return (
        <div className="p-3 rounded-xl bg-surface-elevated/50 border border-border/20">
            <span className="text-[10px] text-foreground-muted block uppercase tracking-wide">{label}</span>
            <span className={`text-sm font-semibold text-foreground mt-0.5 block ${capitalize ? 'capitalize' : ''} ${statusColor || ''}`}>
                {value}
            </span>
        </div>
    );
}
