import plugin from '../src';
import cliPlugin from '../src/cli';

describe('plugin-ssr', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });
});
