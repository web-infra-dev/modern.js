import plugin from '../src';

describe('plugin-lambda-fc', () => {
  it('default', () => {
    expect(plugin).toBeDefined();

    expect(plugin().name).toBe('@modern-js/plugin-lambda-fc');
  });
});
