import plugin, { useHistory, useParams } from '../src';

describe('plugin-router', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});
