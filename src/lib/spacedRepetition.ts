/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * This algorithm schedules flashcard reviews based on how well the user recalls each card.
 *
 * Quality ratings:
 * - 0: Complete blackout, no memory at all
 * - 1: Incorrect response, but correct answer seemed familiar
 * - 2: Incorrect response, but correct answer was easy to recall when shown
 * - 3: Correct response with serious difficulty
 * - 4: Correct response after some hesitation
 * - 5: Perfect response with no hesitation
 *
 * Simplified UI mapping (3 buttons):
 * - "Again" (red) -> quality 1: Card failed, reset and review soon
 * - "Good" (yellow) -> quality 3: Correct but with difficulty
 * - "Easy" (green) -> quality 5: Perfect recall
 */

import { addDays, addMinutes, addHours } from 'date-fns';

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export type SimplifiedRating = 'again' | 'hard' | 'good' | 'easy';

export interface SM2Input {
  quality: QualityRating;
  currentEaseFactor: number;
  currentInterval: number;
  repetitions: number;
  lapses: number;
}

export interface SM2Result {
  nextReview: Date;
  interval: number;      // In days (can be fractional for learning cards)
  easeFactor: number;
  repetitions: number;
  lapses: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

// Default values for new cards
export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  lapses: 0,
  minEaseFactor: 1.3,
  maxEaseFactor: 3.0,
};

// Learning steps (in minutes) for cards that failed or are being learned
const LEARNING_STEPS_MINUTES = [1, 10]; // First fail: 1 min, second: 10 min
const RELEARNING_STEPS_MINUTES = [10]; // When a review card is forgotten

// Number of successful reviews to consider a card "mastered"
const MASTERY_THRESHOLD_DAYS = 21; // Card is mastered if interval reaches 21+ days
const MASTERY_THRESHOLD_REPS = 5;  // Or 5+ successful consecutive reviews

/**
 * Maps simplified UI ratings to SM-2 quality scores
 */
export function simplifiedToQuality(rating: SimplifiedRating): QualityRating {
  switch (rating) {
    case 'again': return 1;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
  }
}

/**
 * Calculates the new ease factor based on the quality of the response
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEaseFactor(currentEF: number, quality: QualityRating): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const newEF = currentEF + delta;

  // Clamp between min and max
  return Math.max(SM2_DEFAULTS.minEaseFactor, Math.min(SM2_DEFAULTS.maxEaseFactor, newEF));
}

/**
 * Determines the card status based on interval and repetitions
 */
function determineStatus(
  interval: number,
  repetitions: number,
  quality: QualityRating
): 'new' | 'learning' | 'review' | 'mastered' {
  // If the user failed the card, it goes back to learning
  if (quality < 3) {
    return 'learning';
  }

  // Check if card qualifies for mastered status
  if (interval >= MASTERY_THRESHOLD_DAYS || repetitions >= MASTERY_THRESHOLD_REPS) {
    return 'mastered';
  }

  // Card is in review phase
  return 'review';
}

/**
 * SM-2 Algorithm Implementation
 *
 * @param input - Current card state and quality rating
 * @returns New card state with next review date
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, currentEaseFactor, currentInterval, repetitions, lapses } = input;
  const now = new Date();

  // Failed response (quality < 3)
  if (quality < 3) {
    // Card is forgotten - reset repetitions and increase lapses
    const newLapses = lapses + 1;

    // Use learning steps for relearning
    const stepIndex = Math.min(newLapses - 1, RELEARNING_STEPS_MINUTES.length - 1);
    const delayMinutes = RELEARNING_STEPS_MINUTES[Math.max(0, stepIndex)];

    return {
      nextReview: addMinutes(now, delayMinutes),
      interval: delayMinutes / (24 * 60), // Convert to fractional days
      easeFactor: calculateNewEaseFactor(currentEaseFactor, quality),
      repetitions: 0, // Reset consecutive successes
      lapses: newLapses,
      status: 'learning',
    };
  }

  // Successful response (quality >= 3)
  let newInterval: number;
  const newRepetitions = repetitions + 1;
  const newEaseFactor = calculateNewEaseFactor(currentEaseFactor, quality);

  // Calculate new interval based on repetition count
  if (newRepetitions === 1) {
    // First successful review
    newInterval = 1; // 1 day
  } else if (newRepetitions === 2) {
    // Second successful review
    newInterval = 6; // 6 days
  } else {
    // Subsequent reviews: multiply previous interval by ease factor
    newInterval = Math.round(currentInterval * newEaseFactor);

    // Apply bonus for easy cards (quality 5)
    if (quality === 5) {
      newInterval = Math.round(newInterval * 1.3);
    }

    // Apply penalty for hard cards (quality 3)
    if (quality === 3) {
      newInterval = Math.max(1, Math.round(newInterval * 0.8));
    }
  }

  // Cap interval at 365 days (1 year)
  newInterval = Math.min(newInterval, 365);

  const status = determineStatus(newInterval, newRepetitions, quality);

  return {
    nextReview: addDays(now, newInterval),
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    lapses: lapses, // Don't change lapses on success
    status,
  };
}

/**
 * Calculate initial SM-2 values for a new card being studied for the first time
 */
export function getInitialSM2ForNewCard(quality: QualityRating): SM2Result {
  return calculateSM2({
    quality,
    currentEaseFactor: SM2_DEFAULTS.easeFactor,
    currentInterval: SM2_DEFAULTS.interval,
    repetitions: SM2_DEFAULTS.repetitions,
    lapses: SM2_DEFAULTS.lapses,
  });
}

/**
 * Get the expected next review intervals for each rating option
 * Useful for showing users what will happen with each choice
 */
export function getPreviewIntervals(
  currentEaseFactor: number,
  currentInterval: number,
  repetitions: number,
  lapses: number
): Record<SimplifiedRating, string> {
  const ratings: SimplifiedRating[] = ['again', 'hard', 'good', 'easy'];
  const previews: Record<string, string> = {};

  for (const rating of ratings) {
    const result = calculateSM2({
      quality: simplifiedToQuality(rating),
      currentEaseFactor,
      currentInterval,
      repetitions,
      lapses,
    });

    previews[rating] = formatInterval(result.interval);
  }

  return previews as Record<SimplifiedRating, string>;
}

/**
 * Format interval for display
 */
export function formatInterval(intervalDays: number): string {
  if (intervalDays < 1/24) {
    // Less than 1 hour - show minutes
    const minutes = Math.round(intervalDays * 24 * 60);
    return `${minutes}m`;
  } else if (intervalDays < 1) {
    // Less than 1 day - show hours
    const hours = Math.round(intervalDays * 24);
    return `${hours}h`;
  } else if (intervalDays < 30) {
    // Less than a month - show days
    const days = Math.round(intervalDays);
    return `${days}d`;
  } else if (intervalDays < 365) {
    // Less than a year - show months
    const months = Math.round(intervalDays / 30);
    return `${months}mo`;
  } else {
    // Show years
    const years = Math.round(intervalDays / 365 * 10) / 10;
    return `${years}y`;
  }
}

/**
 * Check if a card is due for review
 */
export function isCardDue(nextReview: Date | string | null): boolean {
  if (!nextReview) return true; // Cards without next_review are considered due

  const reviewDate = typeof nextReview === 'string' ? new Date(nextReview) : nextReview;
  return reviewDate <= new Date();
}

/**
 * Sort cards by urgency (most overdue first)
 */
export function sortCardsByUrgency<T extends { next_review: string | null; status: string }>(
  cards: T[]
): T[] {
  const now = new Date();

  return [...cards].sort((a, b) => {
    // New cards come first
    if (a.status === 'new' && b.status !== 'new') return -1;
    if (b.status === 'new' && a.status !== 'new') return 1;

    // Then sort by how overdue they are
    const aDate = a.next_review ? new Date(a.next_review) : now;
    const bDate = b.next_review ? new Date(b.next_review) : now;

    return aDate.getTime() - bDate.getTime();
  });
}
