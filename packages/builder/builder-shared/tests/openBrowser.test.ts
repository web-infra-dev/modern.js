import { describe, expect, it, vi } from 'vitest';
import { openBrowser } from '@/openBrowser';

describe('openBrowser', () => {
  it('should open an Microsoft Edge browser if you have', async () => {
    vi.stubEnv('BROWSER', 'Microsoft Edge');
    expect(await openBrowser('https://modernjs.dev/')).toBeTypeOf('boolean');
  });
  it('should open an Google Chrome browser if you have', async () => {
    vi.stubEnv('BROWSER', 'Google Chrome');
    expect(await openBrowser('https://modernjs.dev/')).toBeTypeOf('boolean');
  });
});
