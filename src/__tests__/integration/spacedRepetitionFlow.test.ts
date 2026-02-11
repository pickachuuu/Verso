/**
 * Integration test: Spaced Repetition Study Flow
 *
 * This tests the full study flow by simulating how a card progresses
 * through the SM-2 algorithm over multiple reviews, verifying the
 * interaction between multiple spaced repetition functions.
 */

import {
  calculateSM2,
  getInitialSM2ForNewCard,
  simplifiedToQuality,
  formatInterval,
  isCardDue,
  sortCardsByUrgency,
  getPreviewIntervals,
  SM2_DEFAULTS,
  type SM2Result,
} from '@/lib/spacedRepetition'

describe('Spaced Repetition Study Flow (Integration)', () => {
  describe('complete card lifecycle: new -> learning -> review -> mastered', () => {
    it('progresses a card through the full lifecycle with consistent "good" ratings', () => {
      // Step 1: First review of a new card with "good" rating
      const quality = simplifiedToQuality('good')
      expect(quality).toBe(4)

      let result = getInitialSM2ForNewCard(quality)
      expect(result.interval).toBe(1) // 1 day
      expect(result.repetitions).toBe(1)
      expect(result.status).toBe('review')
      expect(formatInterval(result.interval)).toBe('1d')

      // Step 2: Second review (next day)
      result = calculateSM2({
        quality: simplifiedToQuality('good'),
        currentEaseFactor: result.easeFactor,
        currentInterval: result.interval,
        repetitions: result.repetitions,
        lapses: result.lapses,
      })
      expect(result.interval).toBe(6) // 6 days
      expect(result.repetitions).toBe(2)
      expect(formatInterval(result.interval)).toBe('6d')

      // Step 3: Third review
      result = calculateSM2({
        quality: simplifiedToQuality('good'),
        currentEaseFactor: result.easeFactor,
        currentInterval: result.interval,
        repetitions: result.repetitions,
        lapses: result.lapses,
      })
      // Interval grows: 6 * easeFactor * 0.8 (hard penalty doesn't apply for quality 4)
      expect(result.interval).toBeGreaterThan(6)
      expect(result.repetitions).toBe(3)

      // Step 4: Continue reviewing until mastered
      let reviewCount = 3
      while (result.status !== 'mastered' && reviewCount < 10) {
        result = calculateSM2({
          quality: simplifiedToQuality('good'),
          currentEaseFactor: result.easeFactor,
          currentInterval: result.interval,
          repetitions: result.repetitions,
          lapses: result.lapses,
        })
        reviewCount++
      }

      expect(result.status).toBe('mastered')
      expect(result.lapses).toBe(0) // Never failed
    })
  })

  describe('card recovery after failure', () => {
    it('resets and recovers when a card is failed mid-review', () => {
      // Establish a card with some review history
      let result = getInitialSM2ForNewCard(simplifiedToQuality('good'))
      result = calculateSM2({
        quality: simplifiedToQuality('good'),
        currentEaseFactor: result.easeFactor,
        currentInterval: result.interval,
        repetitions: result.repetitions,
        lapses: result.lapses,
      })

      expect(result.repetitions).toBe(2)
      expect(result.interval).toBe(6)

      // Now the user fails the card
      const failedResult = calculateSM2({
        quality: simplifiedToQuality('again'),
        currentEaseFactor: result.easeFactor,
        currentInterval: result.interval,
        repetitions: result.repetitions,
        lapses: result.lapses,
      })

      expect(failedResult.status).toBe('learning')
      expect(failedResult.repetitions).toBe(0) // Reset
      expect(failedResult.lapses).toBe(1) // Incremented
      expect(failedResult.interval).toBeLessThan(1) // Short relearning interval

      // Recover: review again successfully
      const recoveredResult = calculateSM2({
        quality: simplifiedToQuality('good'),
        currentEaseFactor: failedResult.easeFactor,
        currentInterval: failedResult.interval,
        repetitions: failedResult.repetitions,
        lapses: failedResult.lapses,
      })

      expect(recoveredResult.repetitions).toBe(1) // Starts climbing again
      expect(recoveredResult.lapses).toBe(1) // Lapses preserved
      expect(recoveredResult.interval).toBe(1)
    })
  })

  describe('ease factor drift over many reviews', () => {
    it('maintains ease factor within bounds over many mixed-quality reviews', () => {
      const qualities: Array<'again' | 'hard' | 'good' | 'easy'> = [
        'good', 'good', 'easy', 'hard', 'good', 'again',
        'good', 'good', 'easy', 'hard', 'again', 'good',
        'good', 'good', 'good', 'easy', 'easy',
      ]

      let easeFactor = SM2_DEFAULTS.easeFactor
      let interval = SM2_DEFAULTS.interval
      let repetitions = SM2_DEFAULTS.repetitions
      let lapses = SM2_DEFAULTS.lapses

      for (const rating of qualities) {
        const result = calculateSM2({
          quality: simplifiedToQuality(rating),
          currentEaseFactor: easeFactor,
          currentInterval: interval,
          repetitions,
          lapses,
        })

        // Ease factor should always stay within bounds
        expect(result.easeFactor).toBeGreaterThanOrEqual(SM2_DEFAULTS.minEaseFactor)
        expect(result.easeFactor).toBeLessThanOrEqual(SM2_DEFAULTS.maxEaseFactor)

        // Interval should never be negative
        expect(result.interval).toBeGreaterThanOrEqual(0)

        easeFactor = result.easeFactor
        interval = result.interval
        repetitions = result.repetitions
        lapses = result.lapses
      }
    })
  })

  describe('preview intervals match actual calculations', () => {
    it('preview intervals are consistent with calculateSM2 results', () => {
      const easeFactor = 2.5
      const interval = 6
      const repetitions = 2
      const lapses = 0

      const previews = getPreviewIntervals(easeFactor, interval, repetitions, lapses)

      // Each preview should match what calculateSM2 would produce
      const ratings: Array<'again' | 'hard' | 'good' | 'easy'> = ['again', 'hard', 'good', 'easy']

      for (const rating of ratings) {
        const result = calculateSM2({
          quality: simplifiedToQuality(rating),
          currentEaseFactor: easeFactor,
          currentInterval: interval,
          repetitions,
          lapses,
        })

        expect(previews[rating]).toBe(formatInterval(result.interval))
      }
    })
  })

  describe('study session card sorting', () => {
    it('sorts a mixed set of cards correctly for a study session', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 86400000).toISOString() // 1 day ago
      const futureDateStr = new Date(now.getTime() + 86400000).toISOString() // 1 day from now
      const veryPastDate = new Date(now.getTime() - 86400000 * 7).toISOString() // 7 days ago

      const cards = [
        { next_review: futureDateStr, status: 'review' },   // Not due yet
        { next_review: pastDate, status: 'review' },         // Due (1 day overdue)
        { next_review: null, status: 'new' },                // New card
        { next_review: veryPastDate, status: 'learning' },   // Very overdue
        { next_review: null, status: 'new' },                // Another new card
      ]

      const sorted = sortCardsByUrgency(cards)

      // New cards should come first
      expect(sorted[0].status).toBe('new')
      expect(sorted[1].status).toBe('new')

      // Then most overdue cards
      expect(sorted[2].next_review).toBe(veryPastDate)
      expect(sorted[3].next_review).toBe(pastDate)
      expect(sorted[4].next_review).toBe(futureDateStr)

      // Verify due status of each
      expect(isCardDue(sorted[0].next_review)).toBe(true)  // new, no next_review
      expect(isCardDue(sorted[2].next_review)).toBe(true)  // overdue
      expect(isCardDue(sorted[4].next_review)).toBe(false) // future
    })
  })
})
