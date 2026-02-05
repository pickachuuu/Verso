'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import Card from "@/component/ui/Card";
import Header from "@/component/ui/Header";
import Button from "@/component/ui/Button";
import { useFlashcardActions, StudySetData } from "@/hook/useFlashcardActions";
import { Flashcard } from "@/lib/database.types";
import { Share01Icon, ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle01Icon, Cancel01Icon } from "hugeicons-react";
import { formatMultipleChoiceQuestion } from "@/lib/utils";

export default function FlashcardPage() {
    const params = useParams();
    const router = useRouter();
    const flashcardId = params.flashcardId as string;

    // Core state - load all data once
    const [studyData, setStudyData] = useState<StudySetData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);

    const {
        getStudySetData,
        markFlashcardAsMastered,
        markFlashcardAsLearning,
        togglePublicStatus
    } = useFlashcardActions();

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

    // Load study set data once based on the flashcard ID
    const loadStudyData = useCallback(async () => {
        if (!flashcardId) return;

        setIsLoading(true);
        try {
            // First, get the flashcard to find its set_id
            const { getFlashcardById } = useFlashcardActions();
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
            }
        } catch (error) {
            console.error('Error loading study data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [flashcardId, getStudySetData]);

    useEffect(() => {
        loadStudyData();
    }, [loadStudyData]);

    // Keyboard navigation
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
                case 'm':
                    e.preventDefault();
                    if (showAnswer && currentCard && currentCard.status !== 'mastered') {
                        handleMarkAsMastered();
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
    }, [showAnswer, hasNext, hasPrevious, currentCard]);

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

    const handleMarkAsMastered = useCallback(async () => {
        if (!currentCard || isUpdating) return;

        setIsUpdating(true);
        try {
            const updatedCard = await markFlashcardAsMastered(currentCard.id);

            if (updatedCard) {
                // Update the card in our local state
                setStudyData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        cards: prev.cards.map(c =>
                            c.id === currentCard.id ? updatedCard : c
                        )
                    };
                });
            }
        } catch (error) {
            console.error('Error marking as mastered:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [currentCard, isUpdating, markFlashcardAsMastered]);

    const handleMarkAsLearning = useCallback(async () => {
        if (!currentCard || isUpdating) return;

        setIsUpdating(true);
        try {
            const updatedCard = await markFlashcardAsLearning(currentCard.id);

            if (updatedCard) {
                // Update the card in our local state
                setStudyData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        cards: prev.cards.map(c =>
                            c.id === currentCard.id ? updatedCard : c
                        )
                    };
                });
            }
        } catch (error) {
            console.error('Error marking as learning:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [currentCard, isUpdating, markFlashcardAsLearning]);

    const handleToggleSharing = useCallback(async () => {
        if (!studyData?.set) return;

        setIsSharing(true);
        try {
            const newPublicStatus = !studyData.set.is_public;
            await togglePublicStatus(studyData.set.id, newPublicStatus);

            // Update local state
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
    }, [studyData?.set, togglePublicStatus]);

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
                            <kbd className="px-1.5 py-0.5 bg-background-muted rounded text-xs ml-1">M</kbd> master
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
                            {formatMultipleChoiceQuestion(currentCard.question)}
                        </div>
                    </Card.Header>

                    {showAnswer && (
                        <div className="border-t border-border p-6 bg-background-muted/30">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Answer</h3>
                            <div className="text-lg text-foreground leading-relaxed mb-6 whitespace-pre-line">
                                {currentCard.answer}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                {!isMastered && (
                                    <>
                                        <Button
                                            onClick={handleMarkAsLearning}
                                            disabled={isUpdating}
                                            variant="outline"
                                            className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                        >
                                            <Cancel01Icon className="w-4 h-4 mr-2" />
                                            Still Learning
                                        </Button>
                                        <Button
                                            onClick={handleMarkAsMastered}
                                            disabled={isUpdating}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckmarkCircle01Icon className="w-4 h-4 mr-2" />
                                            {isUpdating ? "Marking..." : "Got It!"}
                                        </Button>
                                    </>
                                )}
                                {isMastered && (
                                    <Button
                                        variant="outline"
                                        onClick={handleNextCard}
                                        disabled={!hasNext}
                                        className="flex-1"
                                    >
                                        {hasNext ? "Next Card" : "Last Card"}
                                        <ArrowRight01Icon className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>

                            {!hasNext && (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                                    <p className="text-green-800 font-medium">
                                        You've completed this set! 🎉
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">
                                        {progress.mastered}/{progress.total} cards mastered ({progress.percentage}%)
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
                                <span className="font-medium capitalize">{currentCard.status}</span>
                            </div>
                            <div className="p-3 bg-background-muted rounded-lg">
                                <span className="text-foreground-muted block text-xs">Difficulty</span>
                                <span className="font-medium">Level {currentCard.difficulty_level}</span>
                            </div>
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
