import plugin from '../src';

describe('plugin-ssg', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(plugin().name).toBe('@modern-js/plugin-ssg');
  });
});
