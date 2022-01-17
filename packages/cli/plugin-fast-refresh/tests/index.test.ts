import plugin from '../src';
import plugin2 from '../src/cli';

describe('plugin-fast-refresh', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(plugin).toBe(plugin2);
  });
});
