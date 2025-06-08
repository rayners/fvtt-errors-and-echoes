/**
 * Author Utilities for Errors and Echoes
 *
 * Utility functions for handling module author information and matching logic
 */

// Extended author interface to handle all Foundry author formats
export interface ModuleAuthor {
  name?: string;
  github?: string;
  email?: string;
  discord?: string;
  url?: string;
}

/**
 * Check if a module matches a given author identifier
 */
export function moduleMatchesAuthor(
  module: Partial<Module> | null | undefined,
  authorIdentifier: string
): boolean {
  if (!module || !authorIdentifier) return false;

  // Handle modern modules with authors collection
  if (module.authors) {
    // Fail fast - only handle actual arrays (legacy) or Sets (v13)
    if (Array.isArray(module.authors) || module.authors instanceof Set) {
      for (const author of module.authors) {
        if (typeof author === 'string') {
          if (author === authorIdentifier) {
            return true;
          }
        } else if (typeof author === 'object' && author) {
          const extendedAuthor = author as ModuleAuthor;
          // Check all available author fields
          if (
            extendedAuthor.name === authorIdentifier ||
            extendedAuthor.github === authorIdentifier ||
            extendedAuthor.email === authorIdentifier
          ) {
            return true;
          }

          // Check additional fields that Foundry provides
          if (
            extendedAuthor.discord === authorIdentifier ||
            extendedAuthor.url === authorIdentifier
          ) {
            return true;
          }

          // Extract username from email (user@host -> user)
          if (extendedAuthor.email && typeof extendedAuthor.email === 'string') {
            const emailUser = extendedAuthor.email.split('@')[0];
            if (emailUser === authorIdentifier) {
              return true;
            }
          }

          // Extract username from URL if present
          if (extendedAuthor.url && typeof extendedAuthor.url === 'string') {
            const url = extendedAuthor.url;
            // Handle GitHub URLs like https://github.com/rayners
            const githubMatch = url.match(/github\.com\/([^/]+)/);
            if (githubMatch && githubMatch[1] === authorIdentifier) {
              return true;
            }
            // Handle other URL patterns as needed
          }
        }
      }
    } else {
      // Invalid authors format - fail fast
      console.warn('Invalid authors format - expected Array or Set, got:', typeof module.authors);
      return false;
    }
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
export function extractAuthorNames(module: Partial<Module> | null | undefined): string[] {
  if (!module) return [];

  const authorNames: string[] = [];

  // Handle modern modules with authors collection
  if (module.authors) {
    // Fail fast - only handle actual arrays (legacy) or Sets (v13)
    if (Array.isArray(module.authors) || module.authors instanceof Set) {
      for (const author of module.authors) {
        if (typeof author === 'string') {
          authorNames.push(author);
        } else if (typeof author === 'object' && author) {
          const typedAuthor = author as ModuleAuthor;
          // Prefer name, then github, then email
          const name = typedAuthor.name || typedAuthor.github || typedAuthor.email;
          if (name) {
            authorNames.push(name);
          }
        }
      }
    } else {
      // Invalid authors format - fail fast and return empty
      console.warn('Invalid authors format - expected Array or Set, got:', typeof module.authors);
      return [];
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
export function getPrimaryAuthorName(module: Partial<Module> | null | undefined): string {
  const authorNames = extractAuthorNames(module);
  return authorNames.length > 0 ? authorNames[0] : 'Unknown';
}

/**
 * Get a formatted author string for display (comma-separated list)
 */
export function getFormattedAuthorString(
  module: Partial<Module> | null | undefined,
  unknownLabel: string = 'Unknown'
): string {
  const authorNames = extractAuthorNames(module);
  return authorNames.length > 0 ? authorNames.join(', ') : unknownLabel;
}

/**
 * Check if a module has any author information
 */
export function hasAuthorInfo(module: Partial<Module> | null | undefined): boolean {
  return extractAuthorNames(module).length > 0;
}
