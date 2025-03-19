// This file handles proper teardown of resources for Jest tests
import { setTimeout, clearTimeout } from 'timers';

// Add hooks to clean up after all tests
afterAll(async () => {
  // Add a small delay to let any pending timeouts/intervals finish
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear all timers
  jest.useRealTimers();
  const timeoutId = setTimeout(() => {}, 0) as unknown as number;
  
  // Clear all possible timer IDs (this is a hack, but works in most cases)
  for (let i = 0; i < timeoutId; i++) {
    try {
      clearTimeout(i as unknown as NodeJS.Timeout);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Force garbage collection if available
  if ((global as any).gc) {
    (global as any).gc();
  }
}); 