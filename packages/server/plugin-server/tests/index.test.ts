import cliPugin from '../src/cli';

describe('plugin-static-hosting', () => {
  it('default', () => {
    expect(cliPugin).toBeDefined();
    expect(cliPugin().name).toBe('@modern-js/plugin-server');
  });
});
