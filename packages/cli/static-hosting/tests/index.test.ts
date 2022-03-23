import plugin from '../src';

describe('plugin-static-hosting', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(plugin().name).toBe('@modern-js/plugin-static-hosting');
  });
});
