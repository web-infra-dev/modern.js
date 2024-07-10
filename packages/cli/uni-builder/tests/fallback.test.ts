import { describe, it, expect } from 'vitest';
import type { RsbuildPlugin } from '@rsbuild/core';
import { createUniBuilder } from '../src';
import { unwrapConfig, matchRules } from './helper';

describe('plugin-fallback', () => {
  const testPlugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyBundlerChain(chain => {
        chain.module
          .rule('mjs')
          .test(/\.m?js/)
          .resolve.set('fullySpecified', false);

        chain.module
          .rule('foo')
          .oneOf('foo')
          .test(/foo/)
          .use('foo')
          .loader('foo');

        chain.module
          .rule('data-uri')
          .resolve.set('fullySpecified', false)
          .end()
          .mimetype('text/javascript')
          .use('data-uri')
          .loader('data-uri');

        chain.module.rule('bar').test(/bar/).use('bar').loader('bar');
      });
    },
  };

  it('should convert fallback rule correctly', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        plugins: [testPlugin],
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const config = await unwrapConfig(rsbuild);

    expect(config.module?.rules?.length).toBe(2);
    expect(
      matchRules({
        config,
        testFile: 'bar',
      }),
    ).toEqual([]);
  });

  it('should convert fallback rule correctly in rspack', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      cwd: '',
      config: {
        plugins: [testPlugin],
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const config = await unwrapConfig(rsbuild);

    expect(config.module?.rules?.length).toBe(2);
    expect(
      matchRules({
        config,
        testFile: 'bar',
      }),
    ).toEqual([]);
  });

  it('should not convert fallback rule when output.enableAssetFallback is not enabled', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        plugins: [testPlugin],
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.module?.rules?.length).toBeGreaterThan(2);

    expect(
      matchRules({
        config,
        testFile: 'bar',
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "test": /bar/,
          "use": [
            {
              "loader": "bar",
            },
          ],
        },
      ]
    `);
  });
});
