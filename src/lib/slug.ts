import slugify from 'slugify';

/**
 * Configuration options for slug generation
 */
const SLUGIFY_OPTIONS = {
  lower: true,           // Convert to lowercase
  strict: true,          // Strip special characters except replacement
  trim: true,            // Trim leading/trailing replacement chars
  locale: 'en',          // Language for transliteration
};

/**
 * Generates a URL-safe slug from a given string
 *
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug string
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('My Note: Chapter 1') // 'my-note-chapter-1'
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return slugify(text, SLUGIFY_OPTIONS);
}

/**
 * Generates a unique slug by appending a short unique identifier
 * This ensures uniqueness even if two notes have the same title
 *
 * @param text - The text to convert to a slug
 * @param uniqueId - A unique identifier (e.g., first 8 chars of UUID)
 * @returns A unique URL-safe slug string
 *
 * @example
 * generateUniqueSlug('Hello World', 'abc12345') // 'hello-world-abc12345'
 */
export function generateUniqueSlug(text: string, uniqueId: string): string {
  const baseSlug = generateSlug(text);

  if (!baseSlug) {
    return uniqueId;
  }

  // Append the unique ID to ensure uniqueness
  return `${baseSlug}-${uniqueId.slice(0, 8)}`;
}

/**
 * Validates if a string is a valid slug format
 *
 * @param slug - The slug to validate
 * @returns Boolean indicating if the slug is valid
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with a hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Extracts the unique ID portion from a slug
 * Useful for looking up notes by their UUID when the slug format is 'title-slug-uniqueid'
 *
 * @param slug - The full slug string
 * @returns The unique ID portion or null if not found
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug) return null;

  // The unique ID is the last segment after the final hyphen (8 characters)
  const parts = slug.split('-');
  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1];

  // Check if it looks like a UUID prefix (8 hex characters)
  if (/^[a-f0-9]{8}$/i.test(lastPart)) {
    return lastPart;
  }

  return null;
}
