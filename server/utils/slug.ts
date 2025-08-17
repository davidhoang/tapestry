/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generate a slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')        // Remove leading hyphens
    .replace(/-+$/, '');       // Remove trailing hyphens
}

/**
 * Generate a unique slug by appending a random suffix if needed
 * @param baseSlug - The base slug to make unique
 * @returns A unique slug with random suffix
 */
export function generateUniqueSlug(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}