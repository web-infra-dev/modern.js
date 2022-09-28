import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';
import { BuilderConfig } from '../../src/types';

describe('modifyBuilderConfig', async () => {
  const builder = await createStubBuilder();
  it('should modify builder config', async () => {
    builder.reset();
    builder.hooks.modifyBuilderConfigHook.tap(config => {
      config.dev = config.dev || {};
      config.dev.port = 1234;
    });
    const config = await builder.unwrapNormalizedBuilderConfig();
    expect(config.dev.port).toBe(1234);
  });
  it('should restrict access to builder config after modified', async () => {
    builder.reset();
    let config: BuilderConfig;
    builder.hooks.modifyBuilderConfigHook.tap(_config => {
      config = _config;
    });
    builder.hooks.modifyWebpackChainHook.tap(() => {
      config.dev = config.dev || {};
      config.dev.port = 1234;
    });
    await expect(builder.build()).rejects.toThrowErrorMatchingInlineSnapshot(
      "\"Cannot assign to read only property 'dev' of object '#<Object>'\"",
    );
  });
});
