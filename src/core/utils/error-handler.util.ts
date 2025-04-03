export function handleError (error: unknown, context: string): never {
  if (error instanceof Error) {
    throw new Error(`Error in ${context}: ${error.message}`);
  }

  throw new Error(`Unknown error in ${context}`);
}
