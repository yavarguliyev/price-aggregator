import { setTimeout, clearTimeout } from 'timers';

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  jest.useRealTimers();
  const timeoutId = setTimeout(() => {}, 0) as unknown as number;
  
  for (let i = 0; i < timeoutId; i++) {
    try {
      clearTimeout(i as unknown as NodeJS.Timeout);
    } catch {}
  }
  
  if ('gc' in global && typeof global.gc === 'function') {
    global.gc();
  }
});

jest.setTimeout(30000);
