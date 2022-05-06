import { createApp } from '../src';
import plugin from '../src/cli';

describe('plugin-runtime', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(createApp).toBeDefined();
  });
});
