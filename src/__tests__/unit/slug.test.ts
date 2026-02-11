import { generateSlug, generateUniqueSlug, isValidSlug, extractIdFromSlug } from '@/lib/slug'

describe('slug utilities', () => {
  // ============================================
  // generateSlug
  // ============================================
  describe('generateSlug', () => {
    it('converts a simple string to a slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
    })

    it('strips special characters', () => {
      expect(generateSlug('My Note: Chapter 1')).toBe('my-note-chapter-1')
    })

    it('handles strings with multiple spaces', () => {
      expect(generateSlug('hello    world')).toBe('hello-world')
    })

    it('converts to lowercase', () => {
      expect(generateSlug('ALL CAPS TITLE')).toBe('all-caps-title')
    })

    it('returns empty string for empty input', () => {
      expect(generateSlug('')).toBe('')
    })

    it('returns empty string for non-string input', () => {
      // @ts-expect-error testing invalid input
      expect(generateSlug(null)).toBe('')
      // @ts-expect-error testing invalid input
      expect(generateSlug(undefined)).toBe('')
      // @ts-expect-error testing invalid input
      expect(generateSlug(123)).toBe('')
    })

    it('handles strings with emojis and unicode', () => {
      const result = generateSlug('Café & Résumé')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('trims leading and trailing whitespace', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world')
    })
  })

  // ============================================
  // generateUniqueSlug
  // ============================================
  describe('generateUniqueSlug', () => {
    it('appends a unique ID to the slug', () => {
      expect(generateUniqueSlug('Hello World', 'abc12345')).toBe('hello-world-abc12345')
    })

    it('truncates uniqueId to 8 characters', () => {
      const result = generateUniqueSlug('Test', 'abcdefghijklmnop')
      expect(result).toBe('test-abcdefgh')
    })

    it('returns only uniqueId when text generates empty slug', () => {
      expect(generateUniqueSlug('', 'abc12345')).toBe('abc12345')
    })

    it('handles UUID-like unique IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = generateUniqueSlug('My Note', uuid)
      expect(result).toBe('my-note-550e8400')
    })
  })

  // ============================================
  // isValidSlug
  // ============================================
  describe('isValidSlug', () => {
    it('accepts a valid slug with letters and hyphens', () => {
      expect(isValidSlug('hello-world')).toBe(true)
    })

    it('accepts a valid slug with numbers', () => {
      expect(isValidSlug('chapter-1-intro')).toBe(true)
    })

    it('accepts a single word slug', () => {
      expect(isValidSlug('hello')).toBe(true)
    })

    it('rejects slugs with uppercase letters', () => {
      expect(isValidSlug('Hello-World')).toBe(false)
    })

    it('rejects slugs starting with a hyphen', () => {
      expect(isValidSlug('-hello')).toBe(false)
    })

    it('rejects slugs ending with a hyphen', () => {
      expect(isValidSlug('hello-')).toBe(false)
    })

    it('rejects slugs with consecutive hyphens', () => {
      expect(isValidSlug('hello--world')).toBe(false)
    })

    it('rejects slugs with special characters', () => {
      expect(isValidSlug('hello_world')).toBe(false)
      expect(isValidSlug('hello world')).toBe(false)
      expect(isValidSlug('hello@world')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidSlug('')).toBe(false)
    })

    it('rejects non-string input', () => {
      // @ts-expect-error testing invalid input
      expect(isValidSlug(null)).toBe(false)
      // @ts-expect-error testing invalid input
      expect(isValidSlug(undefined)).toBe(false)
    })
  })

  // ============================================
  // extractIdFromSlug
  // ============================================
  describe('extractIdFromSlug', () => {
    it('extracts an 8-character hex ID from the end of a slug', () => {
      expect(extractIdFromSlug('my-note-abc12345')).toBe('abc12345')
    })

    it('extracts ID from a complex slug', () => {
      expect(extractIdFromSlug('chapter-1-introduction-to-physics-deadbeef')).toBe('deadbeef')
    })

    it('returns null when slug has no valid hex ID at the end', () => {
      expect(extractIdFromSlug('hello-world')).toBeNull()
    })

    it('returns null for a single segment slug', () => {
      expect(extractIdFromSlug('hello')).toBeNull()
    })

    it('returns null for empty input', () => {
      expect(extractIdFromSlug('')).toBeNull()
    })

    it('returns null when last part is not exactly 8 hex chars', () => {
      expect(extractIdFromSlug('my-note-abc')).toBeNull()      // too short
      expect(extractIdFromSlug('my-note-abc123456')).toBeNull() // too long
    })

    it('handles case-insensitive hex characters', () => {
      expect(extractIdFromSlug('my-note-ABCDEF12')).toBe('ABCDEF12')
    })
  })
})
