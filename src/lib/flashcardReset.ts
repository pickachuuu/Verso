import { SM2_DEFAULTS } from '@/lib/spacedRepetition';
import type { FlashcardSetUpdate, FlashcardUpdate } from '@/lib/database.types';

export function buildFlashcardProgressReset(now: string): FlashcardUpdate {
  return {
    status: 'new',
    last_reviewed: null,
    next_review: null,
    review_count: 0,
    correct_count: 0,
    ease_factor: SM2_DEFAULTS.easeFactor,
    interval_days: SM2_DEFAULTS.interval,
    repetitions: SM2_DEFAULTS.repetitions,
    lapses: SM2_DEFAULTS.lapses,
    updated_at: now,
  };
}

export function buildFlashcardSetProgressReset(now: string): FlashcardSetUpdate {
  return {
    mastered_cards: 0,
    updated_at: now,
  };
}
