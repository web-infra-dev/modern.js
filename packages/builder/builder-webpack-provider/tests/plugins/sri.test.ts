import { describe, expect, it } from 'vitest';
import { PluginSRI } from '@/plugins/sri';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/sri', () => {
  it('should apply default sri plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSRI()],
      builderConfig: {
        security: {
          sri: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it('should apply sri plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSRI()],
      builderConfig: {
        security: {
          sri: {
            hashFuncNames: ['sha384'],
            enabled: true,
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it("should't apply sri plugin", async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSRI()],
      builderConfig: {},
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBeUndefined();
  });
});
