import { describe, expect, it, vi } from 'vitest';
import _ from '@modern-js/utils/lodash';
import { createStubBuilder } from '../../src/stub';
import { normalizeStubPluginOptions } from '../../src/stub/builder';

describe('stub-builder', () => {
  it('should memoize building result', async () => {
    const builder = await createStubBuilder();
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
    const builder = await createStubBuilder();
    const oldConfig = await builder.unwrapWebpackConfig();
    builder.reset();
    expect((builder.build.cache as Map<any, any>).size).toBe(0);
    const newConfig = await builder.unwrapWebpackConfig();
    expect(oldConfig).not.toBe(newConfig);
  });

  it('should call hooks in order when building', async () => {
    const builder = await createStubBuilder();
    const order: string[] = [];
    _.each(builder.hooks, (hook, name) => {
      const actual = hook.call;
      const mocked = vi.spyOn(hook, 'call');
      mocked.mockImplementation((...args: any[]) => {
        order.push(name);
        return actual(...args);
      });
    });
    await builder.build();
    expect(order).toMatchInlineSnapshot(`
      [
        "modifyBuilderConfigHook",
        "modifyWebpackChainHook",
        "modifyWebpackConfigHook",
        "onBeforeBuildHook",
        "onAfterBuildHook",
      ]
    `);
  });

  it.skip('should call hooks in order when start dev server', async () => {
    const builder = await createStubBuilder();
    const order: string[] = [];
    _.each(builder.hooks, (hook, name) => {
      const actual = hook.call;
      const mocked = vi.spyOn(hook, 'call');
      mocked.mockImplementation((...args: any[]) => {
        order.push(name);
        return actual(...args);
      });
    });
    // TODO: start dev server.
    expect(order).toMatchInlineSnapshot();
  });
});

describe('normalizeStubPluginOptions', () => {
  it.each([
    [undefined, { builtin: false, additional: [] }],
    [true, { builtin: true, additional: [] }],
    ['minimal', { builtin: 'minimal', additional: [] }],
    ['default', { builtin: 'default', additional: [] }],
    [{}, { builtin: false, additional: [] }],
    [{ builtin: true }, { builtin: true, additional: [] }],
    [{ builtin: 'minimal' }, { builtin: 'minimal', additional: [] }],
    [{ builtin: 'default' }, { builtin: 'default', additional: [] }],
    [{ additional: [] }, { builtin: false, additional: [] }],
    [{ additional: ['a'] }, { builtin: false, additional: ['a'] }],
    [['a', 'b'], { builtin: false, additional: ['a', 'b'] }],
    [
      { builtin: 'minimal', additional: ['a', 'b'] },
      { builtin: 'minimal', additional: ['a', 'b'] },
    ],
  ])(`should normalize %p to %p`, (input: any, expected) => {
    expect(normalizeStubPluginOptions(input)).toEqual(expected);
  });
});
