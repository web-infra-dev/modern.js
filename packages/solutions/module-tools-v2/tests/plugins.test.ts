import { getPlugins } from '../src/plugins';

describe('plugin.ts', () => {
  it('getPlugins', () => {
    expect(getPlugins('lint')[0].name).toBe('@modern-js/plugin-jarvis');
    expect(getPlugins('change')[0].name).toBe('@modern-js/plugin-changeset');
    expect(getPlugins('release')[0].name).toBe('@modern-js/plugin-changeset');
    expect(getPlugins('bump')[0].name).toBe('@modern-js/plugin-changeset');
    expect(getPlugins('build').length).toBe(0);
    expect(getPlugins('hello').length).toBe(0);
  });
});
