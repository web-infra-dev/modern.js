import plugin from '../../src/plugins/state';
import cliPlugin from '../../src/plugins/state/cli';

describe('plugin-state', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });
});
