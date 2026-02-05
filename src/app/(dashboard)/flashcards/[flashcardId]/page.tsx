'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Card from "@/component/ui/Card";
import Header from "@/component/ui/Header";
import Button from "@/component/ui/Button";
import { useFlashcardActions, SimplifiedRating, formatInterval } from "@/hook/useFlashcardActions";
import { Flashcard } from "@/lib/database.types";
import { Share01Icon, ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle01Icon, Clock01Icon, RepeatIcon, SparklesIcon } from "hugeicons-react";
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

    // Core state - load all data once
    const [studyData, setStudyData] = useState<StudySetData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewPreviews, setReviewPreviews] = useState<Record<SimplifiedRating, string> | null>(null);
    const [lastReviewResult, setLastReviewResult] = useState<{ interval: string; wasSuccessful: boolean } | null>(null);

    // Session tracking
    const sessionIdRef = useRef<string | null>(null);
    const cardsStudiedRef = useRef(0);
    const correctAnswersRef = useRef(0);
    
    // Track cards reviewed in this session (so we can skip them)
    const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());

    // TanStack Query mutations
    const togglePublicMutation = useTogglePublicStatus();

    // Keep old hook for utility functions
    const { getStudySetData, getFlashcardById, reviewFlashcardWithSR, getReviewPreviews } = useFlashcardActions();

    // Derived state from studyData
    const currentCard = useMemo(() => {
        if (!studyData?.cards || currentIndex < 0 || currentIndex >= studyData.cards.length) {
            return null;
        }
        return studyData.cards[currentIndex];
    }, [studyData?.cards, currentIndex]);

    const hasNext = useMemo(() => {
        return studyData ? currentIndex < studyData.cards.length - 1 : false;
    }, [studyData, currentIndex]);

    const hasPrevious = useMemo(() => {
        return currentIndex > 0;
    }, [currentIndex]);

    const progress = useMemo(() => {
        if (!studyData?.cards) {
            return { total: 0, mastered: 0, percentage: 0 };
        }
        const masteredCount = studyData.cards.filter(c => c.status === 'mastered').length;
        return {
            total: studyData.cards.length,
            mastered: masteredCount,
            percentage: studyData.cards.length > 0
                ? Math.round((masteredCount / studyData.cards.length) * 100)
                : 0
        };
    }, [studyData?.cards]);

    // Cards not yet reviewed in this session
    const unreviewedCards = useMemo(() => {
        if (!studyData?.cards) return [];
        return studyData.cards.filter(c => !reviewedCardIds.has(c.id));
    }, [studyData?.cards, reviewedCardIds]);

    // Check if current card was already reviewed this session
    const isCurrentCardReviewed = currentCard ? reviewedCardIds.has(currentCard.id) : false;

    // All cards have been reviewed in this session
    const allCardsReviewedThisSession = studyData?.cards 
        ? studyData.cards.length > 0 && unreviewedCards.length === 0 
        : false;

    // Find next unreviewed card index
    const findNextUnreviewedIndex = useCallback((fromIndex: number): number | null => {
        if (!studyData?.cards) return null;
        // Search forward first
        for (let i = fromIndex + 1; i < studyData.cards.length; i++) {
            if (!reviewedCardIds.has(studyData.cards[i].id)) {
                return i;
            }
        }
        // Then search from beginning
        for (let i = 0; i < fromIndex; i++) {
            if (!reviewedCardIds.has(studyData.cards[i].id)) {
                return i;
            }
        }
        return null;
    }, [studyData?.cards, reviewedCardIds]);

// Load study set data once based on the flashcard ID
    const loadStudyData = useCallback(async () => {
        if (!flashcardId) return;

        setIsLoading(true);
        try {
            // First, get the flashcard to find its set_id
            const flashcard = await getFlashcardById(flashcardId);

            if (!flashcard) {
                setIsLoading(false);
                return;
            }

            // Load the complete study set data
            const data = await getStudySetData(flashcard.set_id);

            if (data) {
                setStudyData(data);
                // Find the index of the current flashcard
                const index = data.cards.findIndex(c => c.id === flashcardId);
                setCurrentIndex(index >= 0 ? index : 0);

                // Start a study session for activity tracking
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

    useEffect(() => {
        loadStudyData();
    }, [loadStudyData]);

    // Update review previews when current card changes
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

    const handleShowAnswer = useCallback(() => {
        setShowAnswer(true);
    }, []);

    const handleNextCard = useCallback(() => {
        if (!hasNext) return;
        setShowAnswer(false);
        setCurrentIndex(prev => prev + 1);
        // Update URL without full page reload
        const nextCard = studyData?.cards[currentIndex + 1];
        if (nextCard) {
            window.history.replaceState(null, '', `/flashcards/${nextCard.id}`);
        }
    }, [hasNext, studyData?.cards, currentIndex]);

    const handlePreviousCard = useCallback(() => {
        if (!hasPrevious) return;
        setShowAnswer(false);
        setCurrentIndex(prev => prev - 1);
        // Update URL without full page reload
        const prevCard = studyData?.cards[currentIndex - 1];
        if (prevCard) {
            window.history.replaceState(null, '', `/flashcards/${prevCard.id}`);
        }
    }, [hasPrevious, studyData?.cards, currentIndex]);

    // Handle review with spaced repetition rating
    const handleReview = useCallback(async (rating: SimplifiedRating) => {
        if (!currentCard || isReviewing) return;

        setIsReviewing(true);
        try {
            const result = await reviewFlashcardWithSR(currentCard.id, rating);

            if (result) {
                // Mark this card as reviewed in this session
                setReviewedCardIds(prev => new Set([...prev, currentCard.id]));

                // Update local state with the reviewed card
                setStudyData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        cards: prev.cards.map(c =>
                            c.id === currentCard.id ? result.flashcard : c
                        )
                    };
                });

                // Show the review result briefly
                const isMastered = result.flashcard.status === 'mastered';
                setLastReviewResult({
                    interval: isMastered ? 'Mastered!' : result.nextReviewFormatted,
                    wasSuccessful: result.wasSuccessful
                });

                // Track the review in the session
                cardsStudiedRef.current += 1;
                if (result.wasSuccessful) {
                    correctAnswersRef.current += 1;
                }

                // Log to session_results if we have a session
                if (sessionIdRef.current) {
                    await logCardReview(
                        sessionIdRef.current,
                        currentCard.id,
                        result.wasSuccessful
                    );
                    await incrementSessionStats(
                        sessionIdRef.current,
                        1,
                        result.wasSuccessful
                    );
                }

                // Auto-advance to next UNREVIEWED card after a brief delay
                setTimeout(() => {
                    setLastReviewResult(null);
                    // Find next unreviewed card (need fresh lookup since state updated)
                    const newReviewedIds = new Set([...reviewedCardIds, currentCard.id]);
                    let nextIdx: number | null = null;
                    
                    if (studyData?.cards) {
                        // Search forward first
                        for (let i = currentIndex + 1; i < studyData.cards.length; i++) {
                            if (!newReviewedIds.has(studyData.cards[i].id)) {
                                nextIdx = i;
                                break;
                            }
                        }
                        // Then search from beginning
                        if (nextIdx === null) {
                            for (let i = 0; i < currentIndex; i++) {
                                if (!newReviewedIds.has(studyData.cards[i].id)) {
                                    nextIdx = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (nextIdx !== null && studyData?.cards) {
                        setShowAnswer(false);
                        setCurrentIndex(nextIdx);
                        const nextCard = studyData.cards[nextIdx];
                        if (nextCard) {
                            window.history.replaceState(null, '', `/flashcards/${nextCard.id}`);
                        }
                    }
                    // If no unreviewed cards left, stay on current (completion screen will show)
                }, 1000);
            }
        } catch (error) {
            console.error('Error reviewing flashcard:', error);
        } finally {
            setIsReviewing(false);
        }
    }, [currentCard, isReviewing, reviewFlashcardWithSR, studyData?.cards, currentIndex, reviewedCardIds]);

    // Keyboard navigation with spaced repetition ratings
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (!showAnswer) {
                        setShowAnswer(true);
                    }
                    break;
                case 'ArrowRight':
                case 'l':
                    e.preventDefault();
                    if (hasNext) {
                        handleNextCard();
                    }
                    break;
                case 'ArrowLeft':
                case 'h':
                    e.preventDefault();
                    if (hasPrevious) {
                        handlePreviousCard();
                    }
                    break;
                // Spaced repetition keyboard shortcuts
                case '1':
                    e.preventDefault();
                    if (showAnswer && !isReviewing) {
                        handleReview('again');
                    }
                    break;
                case '2':
                    e.preventDefault();
                    if (showAnswer && !isReviewing) {
                        handleReview('hard');
                    }
                    break;
                case '3':
                    e.preventDefault();
                    if (showAnswer && !isReviewing) {
                        handleReview('good');
                    }
                    break;
                case '4':
                    e.preventDefault();
                    if (showAnswer && !isReviewing) {
                        handleReview('easy');
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (showAnswer) {
                        setShowAnswer(false);
                    }
                    break;
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

            setStudyData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    set: { ...prev.set, is_public: newPublicStatus }
                };
            });
        } catch (error) {
            console.error('Error toggling sharing:', error);
        } finally {
            setIsSharing(false);
        }
    }, [studyData?.set, togglePublicMutation]);

    const handleCopyShareLink = useCallback(async () => {
        if (!studyData?.set) return;

        // First make it public if not already
        if (!studyData.set.is_public) {
            await handleToggleSharing();
        }

        const shareUrl = `${window.location.origin}/public/flashcards/${studyData.set.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareLinkCopied(true);
            setTimeout(() => setShareLinkCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    }, [studyData?.set, handleToggleSharing]);

    const handleBackToSets = useCallback(() => {
        router.push('/flashcards');
    }, [router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-background-muted rounded mb-6 w-1/3"></div>
                        <div className="h-4 bg-background-muted rounded mb-8 w-1/2"></div>
                        <div className="h-64 bg-background-muted rounded-xl mb-4"></div>
                        <div className="h-12 bg-background-muted rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Not found state
    if (!currentCard || !studyData) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto">
                    <Header title="Flashcard Not Found" />
                    <Card className="mt-6">
                        <Card.Header>
                            <p className="text-foreground-muted">The flashcard you're looking for doesn't exist.</p>
                            <Button onClick={handleBackToSets} className="mt-4">
                                Back to Flashcard Sets
                            </Button>
                        </Card.Header>
                    </Card>
                </div>
            </div>
        );
    }

    const isMastered = currentCard.status === 'mastered';
    const isLearning = currentCard.status === 'learning';

    // Session complete - all cards reviewed
    if (allCardsReviewedThisSession) {
        const masteredCount = studyData.cards.filter(c => c.status === 'mastered').length;
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBackToSets}
                            className="p-2 rounded-lg hover:bg-background-muted transition-colors"
                            title="Back to sets"
                        >
                            <ArrowLeft01Icon className="w-5 h-5" />
                        </button>
                        <Header title={studyData.set.title || "Flashcards"} />
                    </div>
                    
                    <Card className="text-center py-12">
                        <Card.Header>
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Session Complete!
                            </h2>
                            <p className="text-foreground-muted mb-6">
                                You've reviewed all {studyData.cards.length} cards in this set.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
                                    <div className="text-sm text-green-700">Mastered</div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{cardsStudiedRef.current}</div>
                                    <div className="text-sm text-blue-700">Studied</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={handleBackToSets} variant="outline">
                                    Back to Sets
                                </Button>
                                <Button onClick={() => {
                                    setReviewedCardIds(new Set());
                                    setCurrentIndex(0);
                                    setShowAnswer(false);
                                    cardsStudiedRef.current = 0;
                                    correctAnswersRef.current = 0;
                                }}>
                                    Study Again
                                </Button>
                            </div>
                        </Card.Header>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header with progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToSets}
                                className="p-2 rounded-lg hover:bg-background-muted transition-colors"
                                title="Back to sets"
                            >
                                <ArrowLeft01Icon className="w-5 h-5" />
                            </button>
                            <Header title={studyData.set.title || "Flashcards"} />
                        </div>
                        <div className="flex items-center gap-2">
                            {studyData.set.is_public && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Public
                                </span>
                            )}
                            <Button
                                onClick={handleCopyShareLink}
                                variant="outline"
                                size="sm"
                                disabled={isSharing}
                                className="flex items-center gap-2"
                            >
                                <Share01Icon className="w-4 h-4" />
                                {shareLinkCopied ? 'Copied!' : 'Share'}
                            </Button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-foreground-muted">
                                Progress: {progress.mastered}/{progress.total} cards mastered
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {progress.percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-background-muted rounded-full h-2">
                            <div
                                className="bg-accent h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Keyboard shortcuts hint */}
                    <div className="mt-3 text-xs text-foreground-muted">
                        <span className="hidden sm:inline">
                            Shortcuts: <kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs">Space</kbd> reveal ·
                            <kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs ml-1">←</kbd><kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs">→</kbd> navigate ·
                            <kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs ml-1">1</kbd>-<kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs">4</kbd> rate
                        </span>
                    </div>
                </div>

                {/* Flashcard */}
                <Card className="mb-6 overflow-hidden">
                    <Card.Header className="pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold text-foreground">Question</h2>
                            <div className="flex items-center gap-2">
                                {isMastered && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        <CheckmarkCircle01Icon className="w-3 h-3" />
                                        Mastered
                                    </span>
                                )}
                                {isLearning && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                        Learning
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-lg text-foreground leading-relaxed whitespace-pre-line">
                            {currentCard.question}
                        </div>
                    </Card.Header>

                    {showAnswer && (
                        <div className="border-t border-border p-6 bg-background-muted/30">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Answer</h3>
                            <div className="text-lg text-foreground leading-relaxed mb-6 whitespace-pre-line">
                                {currentCard.answer}
                            </div>

                            {/* Review result feedback */}
                            {lastReviewResult && (
                                <div className={`mb-4 p-3 rounded-lg text-center ${
                                    lastReviewResult.wasSuccessful
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                }`}>
                                    <span className="font-medium">
                                        {lastReviewResult.wasSuccessful ? 'Correct!' : 'Keep practicing!'}
                                    </span>
                                    <span className="ml-2 text-sm">
                                        Next review in {lastReviewResult.interval}
                                    </span>
                                </div>
                            )}

                            {/* Spaced Repetition Rating Buttons */}
                            {!lastReviewResult && (
                                <div className="space-y-3">
                                    <p className="text-sm text-foreground-muted text-center">
                                        How well did you know this?
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            onClick={() => handleReview('again')}
                                            disabled={isReviewing}
                                            className="flex flex-col items-center p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50"
                                        >
                                            <RepeatIcon className="w-5 h-5 text-red-600 mb-1" />
                                            <span className="text-sm font-medium text-red-700">Again</span>
                                            {reviewPreviews && (
                                                <span className="text-xs text-red-500 mt-1">
                                                    {reviewPreviews.again}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleReview('hard')}
                                            disabled={isReviewing}
                                            className="flex flex-col items-center p-3 rounded-lg border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all disabled:opacity-50"
                                        >
                                            <Clock01Icon className="w-5 h-5 text-orange-600 mb-1" />
                                            <span className="text-sm font-medium text-orange-700">Hard</span>
                                            {reviewPreviews && (
                                                <span className="text-xs text-orange-500 mt-1">
                                                    {reviewPreviews.hard}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleReview('good')}
                                            disabled={isReviewing}
                                            className="flex flex-col items-center p-3 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all disabled:opacity-50"
                                        >
                                            <CheckmarkCircle01Icon className="w-5 h-5 text-green-600 mb-1" />
                                            <span className="text-sm font-medium text-green-700">Good</span>
                                            {reviewPreviews && (
                                                <span className="text-xs text-green-500 mt-1">
                                                    {reviewPreviews.good}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleReview('easy')}
                                            disabled={isReviewing}
                                            className="flex flex-col items-center p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
                                        >
                                            <SparklesIcon className="w-5 h-5 text-blue-600 mb-1" />
                                            <span className="text-sm font-medium text-blue-700">Easy</span>
                                            {reviewPreviews && (
                                                <span className="text-xs text-blue-500 mt-1">
                                                    {reviewPreviews.easy}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-foreground-muted text-center">
                                        Press <kbd className="px-1 py-0.5 bg-background-muted rounded">1</kbd>-<kbd className="px-1 py-0.5 bg-background-muted rounded">4</kbd> for quick rating
                                    </p>
                                </div>
                            )}

                            {/* Navigation for mastered cards */}
                            {isMastered && !lastReviewResult && (
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleNextCard}
                                        disabled={!hasNext}
                                        className="w-full"
                                    >
                                        {hasNext ? "Next Card" : "Last Card"}
                                        <ArrowRight01Icon className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}

                            {!hasNext && !lastReviewResult && (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                                    <p className="text-green-800 font-medium">
                                        You've completed this set!
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">
                                        {progress.mastered}/{progress.total} cards mastered ({progress.percentage}%)
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">
                                        Cards studied this session: {cardsStudiedRef.current}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!showAnswer && (
                        <div className="border-t border-border p-6">
                            <Button
                                onClick={handleShowAnswer}
                                className="w-full"
                                size="lg"
                            >
                                Reveal Answer
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <Button
                        variant="outline"
                        onClick={handlePreviousCard}
                        disabled={!hasPrevious}
                        size="sm"
                        className="min-w-[100px]"
                    >
                        <ArrowLeft01Icon className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-muted">
                            Card {currentIndex + 1} of {studyData.cards.length}
                        </span>
                        {/* Card position dots for small sets */}
                        {studyData.cards.length <= 10 && (
                            <div className="hidden sm:flex gap-1 ml-3">
                                {studyData.cards.map((card, idx) => (
                                    <button
                                        key={card.id}
                                        onClick={() => {
                                            setCurrentIndex(idx);
                                            setShowAnswer(false);
                                            window.history.replaceState(null, '', `/flashcards/${card.id}`);
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            idx === currentIndex
                                                ? 'bg-accent w-4'
                                                : card.status === 'mastered'
                                                    ? 'bg-green-400'
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        title={`Card ${idx + 1}${card.status === 'mastered' ? ' (mastered)' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleNextCard}
                        disabled={!hasNext}
                        size="sm"
                        className="min-w-[100px]"
                    >
                        Next
                        <ArrowRight01Icon className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                {/* Card stats */}
                <Card>
                    <Card.Header>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Card Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Status</span>
                                <span className={`font-medium capitalize ${
                                    currentCard.status === 'mastered' ? 'text-green-600' :
                                    currentCard.status === 'learning' ? 'text-yellow-600' :
                                    currentCard.status === 'review' ? 'text-blue-600' : ''
                                }`}>{currentCard.status}</span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Ease Factor</span>
                                <span className="font-medium">
                                    {((currentCard as any).ease_factor || 2.5).toFixed(2)}
                                </span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Interval</span>
                                <span className="font-medium">
                                    {(currentCard as any).interval_days
                                        ? formatInterval((currentCard as any).interval_days)
                                        : 'New'}
                                </span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Repetitions</span>
                                <span className="font-medium">{(currentCard as any).repetitions || 0}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Reviews</span>
                                <span className="font-medium">{currentCard.review_count}</span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Correct</span>
                                <span className="font-medium">
                                    {currentCard.correct_count}
                                    {currentCard.review_count > 0 && (
                                        <span className="text-foreground-muted ml-1">
                                            ({Math.round((currentCard.correct_count / currentCard.review_count) * 100)}%)
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Lapses</span>
                                <span className="font-medium">{(currentCard as any).lapses || 0}</span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Next Review</span>
                                <span className="font-medium text-xs">
                                    {currentCard.next_review
                                        ? new Date(currentCard.next_review).toLocaleDateString()
                                        : 'Now'}
                                </span>
                            </div>
                        </div>
                        {currentCard.last_reviewed && (
                            <div className="mt-3 text-sm text-foreground-muted">
                                Last reviewed: {new Date(currentCard.last_reviewed).toLocaleDateString()}
                            </div>
                        )}
                    </Card.Header>
                </Card>
            </div>
        </div>
    );
}
