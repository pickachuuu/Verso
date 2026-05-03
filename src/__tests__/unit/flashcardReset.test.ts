import {
  buildFlashcardProgressReset,
  buildFlashcardSetProgressReset,
} from '@/lib/flashcardReset';

describe('flashcard progress reset', () => {
  const now = '2026-05-03T12:00:00.000Z';

  it('resets a card to a new unscheduled state', () => {
    expect(buildFlashcardProgressReset(now)).toEqual({
      status: 'new',
      last_reviewed: null,
      next_review: null,
      review_count: 0,
      correct_count: 0,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      lapses: 0,
      updated_at: now,
    });
  });

  it('resets set mastery progress', () => {
    expect(buildFlashcardSetProgressReset(now)).toEqual({
      mastered_cards: 0,
      updated_at: now,
    });
  });
});
