import plugin, { useHistory, useParams } from '../src';
import cliPlugin from '../src/cli';

describe('plugin-router', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router', () => {
  test('should hooks work correctly', async () => {
    const hooks: any = cliPlugin.initializer();
    expect(hooks.config).toBeDefined();
  });
});
