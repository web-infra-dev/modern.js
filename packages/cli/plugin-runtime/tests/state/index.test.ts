import plugin from '../../src/state/runtime';
import cliPlugin from '../../src/state/cli';

describe('plugin-state', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });
});
