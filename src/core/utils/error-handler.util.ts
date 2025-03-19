/**
 * Common error handling utility to eliminate duplication across services
 *
 * @param error The error to handle
 * @param context The context in which the error occurred
 * @returns Never returns, always throws an error
 */
export function handleError(error: unknown, context: string): never {
  if (error instanceof Error) {
    throw new Error(`Error in ${context}: ${error.message}`);
  }
  throw new Error(`Unknown error in ${context}`);
}
