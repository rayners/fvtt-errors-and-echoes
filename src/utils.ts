/**
 * Common utility functions for error handling and operations
 */

/**
 * Safe console.debug that falls back to console.log
 */
export function debugLog(message: string, ...args: any[]): void {
  if (typeof console.debug === 'function') {
    console.debug(message, ...args);
  } else {
    console.log(message, ...args);
  }
}

/**
 * Safely execute a function with error handling and default fallback
 */
export function safeExecute<T>(operation: () => T, fallback: T, context: string): T {
  try {
    return operation();
  } catch (error) {
    console.warn(`Errors and Echoes: ${context}:`, error);
    return fallback;
  }
}

/**
 * Safely execute an async function with error handling and default fallback
 */
export async function safeExecuteAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`Errors and Echoes: ${context}:`, error);
    return fallback;
  }
}

/**
 * Safely get a game setting with fallback
 */
export function getSetting<T>(key: string, fallback: T): T {
  return safeExecute(
    () => {
      const value = game.settings.get('errors-and-echoes', key) as T;
      return value !== undefined && value !== null ? value : fallback;
    },
    fallback,
    `Failed to get setting '${key}'`
  );
}

/**
 * Safely set a game setting
 */
export async function setSetting<T>(key: string, value: T): Promise<boolean> {
  try {
    await game.settings.set('errors-and-echoes', key, value);
    return true;
  } catch (error) {
    console.warn(`Errors and Echoes: Failed to set setting '${key}':`, error);
    return false;
  }
}

/**
 * Safely get a module from the game modules registry
 */
export function getModule(moduleId: string): any {
  return safeExecute(() => game.modules.get(moduleId), null, `Failed to get module '${moduleId}'`);
}
