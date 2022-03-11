import plugin from '../src/runtime';
import cliPlugin from '../src/cli';

describe('plugin-state', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });
});
