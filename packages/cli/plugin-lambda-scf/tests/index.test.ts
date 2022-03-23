import plugin from '../src';

describe('plugin-lambda-scf', () => {
  it('default', () => {
    expect(plugin).toBeDefined();

    expect(plugin().name).toBe('@modern-js/plugin-lambda-scf');
  });
});
