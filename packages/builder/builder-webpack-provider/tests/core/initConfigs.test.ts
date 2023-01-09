import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '@/stub';
import { BuilderConfig } from '@/types';

describe('modifyBuilderConfig', () => {
  it.skip('should not allow to modify builder config', async () => {
    const builder = await createStubBuilder();
    let config: BuilderConfig;
    builder.hooks.modifyBuilderConfigHook.tap(_config => {
      config = _config;
      config.dev = { port: 8080 };
    });
    builder.hooks.modifyWebpackChainHook.tap(() => {
      config.dev!.port = 8899;
    });
    await expect(builder.build).rejects.toThrowErrorMatchingInlineSnapshot(
      "\"Cannot assign to read only property 'port' of object '#<Object>'\"",
    );
  });

  it('should modify config by utils', async () => {
    const builder = await createStubBuilder({
      plugins: 'basic',
      entry: {
        main: 'src/index.ts',
      },
      builderConfig: {
        source: {
          preEntry: 'a.js',
        },
      },
    });
    builder.hooks.modifyBuilderConfigHook.tap((config, utils) =>
      utils.mergeBuilderConfig(config, {
        output: {
          charset: 'ascii',
        },
        source: {
          preEntry: ['b.js'],
        },
      }),
    );
    const config = await builder.unwrapWebpackConfig();
    expect(config.entry).toEqual({
      main: [
        'data:text/javascript,import "core-js";',
        'a.js',
        'b.js',
        'src/index.ts',
      ],
    });
  });
});
