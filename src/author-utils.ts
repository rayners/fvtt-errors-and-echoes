/**
 * Author Utilities for Errors and Echoes
 *
 * Utility functions for handling module author information and matching logic
 */

export interface ModuleAuthor {
  name?: string;
  github?: string;
  email?: string;
}

/**
 * Check if a module matches a given author identifier
 */
export function moduleMatchesAuthor(module: any, authorIdentifier: string): boolean {
  if (!module || !authorIdentifier) return false;

  // Handle modern modules with authors collection (Array, Set, or other iterable)
  if (module.authors) {
    const authorsIterable = Array.isArray(module.authors)
      ? module.authors
      : Array.from(module.authors);
    return authorsIterable.some((author: ModuleAuthor | string) => {
      if (typeof author === 'string') {
        return author === authorIdentifier;
      }
      if (typeof author === 'object' && author) {
        return (
          author.name === authorIdentifier ||
          author.github === authorIdentifier ||
          author.email === authorIdentifier
        );
      }
      return false;
    });
  }

  // Handle legacy modules with single author field
  if (module.author && typeof module.author === 'string') {
    return module.author === authorIdentifier;
  }

  return false;
}

/**
 * Extract all author names from a module's author information
 */
export function extractAuthorNames(module: any): string[] {
  if (!module) return [];

  const authorNames: string[] = [];

  // Handle modern modules with authors collection (Array, Set, or other iterable)
  if (module.authors) {
    try {
      const authorsIterable = Array.isArray(module.authors)
        ? module.authors
        : Array.from(module.authors);
      for (const author of authorsIterable) {
        if (typeof author === 'string') {
          authorNames.push(author);
        } else if (typeof author === 'object' && author) {
          // Prefer name, then github, then email
          const name = author.name || author.github || author.email;
          if (name) {
            authorNames.push(name);
          }
        }
      }
    } catch (error) {
      // If authors is not iterable, fall back to checking for legacy author field
      console.warn('Error parsing module authors:', error);
    }
  }

  // Handle legacy modules with single author field
  if (module.author && typeof module.author === 'string') {
    authorNames.push(module.author);
  }

  return authorNames.filter(Boolean);
}

/**
 * Get the primary author name for display purposes
 */
export function getPrimaryAuthorName(module: any): string {
  const authorNames = extractAuthorNames(module);
  return authorNames.length > 0 ? authorNames[0] : 'Unknown';
}

/**
 * Get a formatted author string for display (comma-separated list)
 */
export function getFormattedAuthorString(module: any, unknownLabel: string = 'Unknown'): string {
  const authorNames = extractAuthorNames(module);
  return authorNames.length > 0 ? authorNames.join(', ') : unknownLabel;
}

/**
 * Check if a module has any author information
 */
export function hasAuthorInfo(module: any): boolean {
  return extractAuthorNames(module).length > 0;
}
