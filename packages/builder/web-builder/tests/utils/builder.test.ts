import { expect, it, describe } from 'vitest';
import { createStubBuilder } from './builder';

describe('tests/stub-builder', () => {
  it('should memoize building result', async () => {
    const builder = createStubBuilder();
    const oldConfig = await builder.unwrapWebpackConfig();
    const newConfig = await builder.unwrapWebpackConfig();
    expect(oldConfig).toBe(newConfig);
  });

  it('should return fresh result after reset', async () => {
    const builder = createStubBuilder();
    const oldConfig = await builder.unwrapWebpackConfig();
    builder.reset();
    const newConfig = await builder.unwrapWebpackConfig();
    expect(oldConfig).not.toBe(newConfig);
  });
});
