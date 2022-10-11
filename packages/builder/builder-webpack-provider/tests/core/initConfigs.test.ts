import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';
import { BuilderConfig } from '../../src/types';

describe('modifyBuilderConfig', () => {
  it('should not allow to modify builder config', async () => {
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
});
