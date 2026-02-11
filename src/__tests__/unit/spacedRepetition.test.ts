import {
  simplifiedToQuality,
  calculateSM2,
  getInitialSM2ForNewCard,
  formatInterval,
  isCardDue,
  sortCardsByUrgency,
  SM2_DEFAULTS,
  type SM2Input,
  type QualityRating,
} from '@/lib/spacedRepetition'

describe('Spaced Repetition (SM-2 Algorithm)', () => {
  // ============================================
  // simplifiedToQuality
  // ============================================
  describe('simplifiedToQuality', () => {
    it('maps "again" to quality 1', () => {
      expect(simplifiedToQuality('again')).toBe(1)
    })

    it('maps "hard" to quality 3', () => {
      expect(simplifiedToQuality('hard')).toBe(3)
    })

    it('maps "good" to quality 4', () => {
      expect(simplifiedToQuality('good')).toBe(4)
    })

    it('maps "easy" to quality 5', () => {
      expect(simplifiedToQuality('easy')).toBe(5)
    })
  })

  // ============================================
  // calculateSM2
  // ============================================
  describe('calculateSM2', () => {
    const defaultInput: SM2Input = {
      quality: 4,
      currentEaseFactor: SM2_DEFAULTS.easeFactor,
      currentInterval: SM2_DEFAULTS.interval,
      repetitions: SM2_DEFAULTS.repetitions,
      lapses: SM2_DEFAULTS.lapses,
    }

    describe('successful responses (quality >= 3)', () => {
      it('returns interval of 1 day on first successful review', () => {
        const result = calculateSM2({ ...defaultInput, quality: 4 })
        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(1)
      })

      it('returns interval of 6 days on second successful review', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 4,
          repetitions: 1,
          currentInterval: 1,
        })
        expect(result.interval).toBe(6)
        expect(result.repetitions).toBe(2)
      })

      it('multiplies interval by ease factor on third+ review', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 4,
          repetitions: 2,
          currentInterval: 6,
          currentEaseFactor: 2.5,
        })
        // 6 * 2.5 = 15
        expect(result.interval).toBe(15)
        expect(result.repetitions).toBe(3)
      })

      it('applies easy bonus (1.3x) for quality 5', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 5,
          repetitions: 2,
          currentInterval: 6,
          currentEaseFactor: 2.5,
        })
        // newEF = 2.6, round(6 * 2.6) = 16, round(16 * 1.3) = 21
        expect(result.interval).toBe(21)
      })

      it('applies hard penalty (0.8x) for quality 3', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 3,
          repetitions: 2,
          currentInterval: 6,
          currentEaseFactor: 2.5,
        })
        // newEF = 2.36, round(6 * 2.36) = 14, max(1, round(14 * 0.8)) = 11
        expect(result.interval).toBe(11)
      })

      it('caps interval at 365 days', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 5,
          repetitions: 10,
          currentInterval: 300,
          currentEaseFactor: 2.5,
        })
        expect(result.interval).toBeLessThanOrEqual(365)
      })

      it('does not change lapses on success', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 4,
          lapses: 3,
        })
        expect(result.lapses).toBe(3)
      })
    })

    describe('failed responses (quality < 3)', () => {
      it('resets repetitions to 0', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 1,
          repetitions: 5,
        })
        expect(result.repetitions).toBe(0)
      })

      it('increments lapses', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 1,
          lapses: 2,
        })
        expect(result.lapses).toBe(3)
      })

      it('sets status to learning', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 1,
        })
        expect(result.status).toBe('learning')
      })

      it('sets a short interval (minutes converted to fractional days)', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 0,
        })
        // Should be a very small interval (minutes expressed as fractional days)
        expect(result.interval).toBeLessThan(1)
        expect(result.interval).toBeGreaterThan(0)
      })
    })

    describe('ease factor calculation', () => {
      it('increases ease factor for quality 5', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 5,
          currentEaseFactor: 2.5,
        })
        expect(result.easeFactor).toBeGreaterThan(2.5)
      })

      it('decreases ease factor for quality 3', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 3,
          currentEaseFactor: 2.5,
        })
        expect(result.easeFactor).toBeLessThan(2.5)
      })

      it('never goes below minimum ease factor (1.3)', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 0,
          currentEaseFactor: 1.3,
        })
        expect(result.easeFactor).toBeGreaterThanOrEqual(SM2_DEFAULTS.minEaseFactor)
      })

      it('never exceeds maximum ease factor (3.0)', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 5,
          currentEaseFactor: 3.0,
        })
        expect(result.easeFactor).toBeLessThanOrEqual(SM2_DEFAULTS.maxEaseFactor)
      })
    })

    describe('status determination', () => {
      it('returns "mastered" when interval reaches 21+ days', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 5,
          repetitions: 3,
          currentInterval: 15,
          currentEaseFactor: 2.5,
        })
        // 15 * 2.5 * 1.3 = 48.75 -> 49 days, which is >= 21
        expect(result.status).toBe('mastered')
      })

      it('returns "mastered" when repetitions reach 5+', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 4,
          repetitions: 4, // will become 5 after increment
          currentInterval: 6,
          currentEaseFactor: 2.5,
        })
        expect(result.status).toBe('mastered')
      })

      it('returns "review" for successful but not yet mastered', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 4,
          repetitions: 0, // first review, interval = 1 day
        })
        expect(result.status).toBe('review')
      })

      it('returns "learning" for failed responses', () => {
        const result = calculateSM2({
          ...defaultInput,
          quality: 2,
        })
        expect(result.status).toBe('learning')
      })
    })

    describe('nextReview date', () => {
      it('returns a future date', () => {
        const now = new Date()
        const result = calculateSM2({ ...defaultInput, quality: 4 })
        expect(result.nextReview.getTime()).toBeGreaterThan(now.getTime())
      })
    })
  })

  // ============================================
  // getInitialSM2ForNewCard
  // ============================================
  describe('getInitialSM2ForNewCard', () => {
    it('creates initial SM2 result with default values for quality 4', () => {
      const result = getInitialSM2ForNewCard(4)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.lapses).toBe(0)
    })

    it('handles a failed first attempt (quality 1)', () => {
      const result = getInitialSM2ForNewCard(1)
      expect(result.status).toBe('learning')
      expect(result.repetitions).toBe(0)
      expect(result.lapses).toBe(1)
    })

    it('handles a perfect first attempt (quality 5)', () => {
      const result = getInitialSM2ForNewCard(5)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
    })
  })

  // ============================================
  // formatInterval
  // ============================================
  describe('formatInterval', () => {
    it('formats minutes for very short intervals', () => {
      // 10 minutes = 10 / (24 * 60) ≈ 0.00694 days
      expect(formatInterval(10 / (24 * 60))).toBe('10m')
    })

    it('formats hours for sub-day intervals', () => {
      // 12 hours = 0.5 days
      expect(formatInterval(0.5)).toBe('12h')
    })

    it('formats days for short intervals', () => {
      expect(formatInterval(1)).toBe('1d')
      expect(formatInterval(7)).toBe('7d')
      expect(formatInterval(14)).toBe('14d')
    })

    it('formats months for medium intervals', () => {
      expect(formatInterval(30)).toBe('1mo')
      expect(formatInterval(90)).toBe('3mo')
    })

    it('formats years for long intervals', () => {
      expect(formatInterval(365)).toBe('1y')
      expect(formatInterval(730)).toBe('2y')
    })
  })

  // ============================================
  // isCardDue
  // ============================================
  describe('isCardDue', () => {
    it('returns true for null nextReview', () => {
      expect(isCardDue(null)).toBe(true)
    })

    it('returns true for a past date', () => {
      const pastDate = new Date('2020-01-01')
      expect(isCardDue(pastDate)).toBe(true)
    })

    it('returns true for a past date string', () => {
      expect(isCardDue('2020-01-01T00:00:00.000Z')).toBe(true)
    })

    it('returns false for a future date', () => {
      const futureDate = new Date('2099-12-31')
      expect(isCardDue(futureDate)).toBe(false)
    })

    it('returns false for a future date string', () => {
      expect(isCardDue('2099-12-31T23:59:59.000Z')).toBe(false)
    })
  })

  // ============================================
  // sortCardsByUrgency
  // ============================================
  describe('sortCardsByUrgency', () => {
    it('puts new cards first', () => {
      const cards = [
        { next_review: '2020-01-01', status: 'review' },
        { next_review: null, status: 'new' },
        { next_review: '2020-06-01', status: 'learning' },
      ]

      const sorted = sortCardsByUrgency(cards)
      expect(sorted[0].status).toBe('new')
    })

    it('sorts remaining cards by next_review date (most overdue first)', () => {
      const cards = [
        { next_review: '2020-06-01', status: 'review' },
        { next_review: '2020-01-01', status: 'review' },
        { next_review: '2020-03-01', status: 'learning' },
      ]

      const sorted = sortCardsByUrgency(cards)
      expect(sorted[0].next_review).toBe('2020-01-01')
      expect(sorted[1].next_review).toBe('2020-03-01')
      expect(sorted[2].next_review).toBe('2020-06-01')
    })

    it('does not mutate the original array', () => {
      const cards = [
        { next_review: '2020-06-01', status: 'review' },
        { next_review: '2020-01-01', status: 'review' },
      ]

      const sorted = sortCardsByUrgency(cards)
      expect(sorted).not.toBe(cards)
      expect(cards[0].next_review).toBe('2020-06-01') // unchanged
    })

    it('handles empty array', () => {
      expect(sortCardsByUrgency([])).toEqual([])
    })
  })
})
