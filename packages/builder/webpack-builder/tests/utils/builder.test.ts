import _ from '@modern-js/utils/lodash';
import { expect, it, describe } from 'vitest';
import { createStubBuilder } from '../../src/stub';

describe('tests/stub-builder', () => {
  it('should memoize building result', async () => {
    const builder = createStubBuilder();
    const oldConfig = await builder.unwrapWebpackConfig();
    const newConfig = await builder.unwrapWebpackConfig();
    expect(oldConfig).toBe(newConfig);
  });

  it('lodash memoize should be reset', async () => {
    const fn = _.memoize(Math.random);
    const old = fn();
    fn.cache.clear!();
    const newOne = fn();
    expect(old).not.toBe(newOne);
  });

  it('should return fresh result after reset', async () => {
    const builder = createStubBuilder();
    const oldConfig = await builder.unwrapWebpackConfig();
    builder.reset();
    expect(builder.build.cache.size).toBe(0);
    const newConfig = await builder.unwrapWebpackConfig();
    expect(oldConfig).not.toBe(newConfig);
  });
});
