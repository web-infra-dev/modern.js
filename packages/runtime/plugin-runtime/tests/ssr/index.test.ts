import { time } from '@modern-js/runtime-utils/time';
import cliPlugin from '../../src/cli/ssr';
import plugin from '../../src/core/server/index';

describe('plugin-ssr', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });

  it('should time work correctly', async () => {
    const end = time();
    await new Promise((resolve, _reject) => {
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });
    const cost = end();
    expect(typeof cost === 'number').toBeTruthy();
  });
});
