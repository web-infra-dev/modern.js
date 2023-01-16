import { describe, expect, it } from 'vitest';
import { builderPluginSRI } from '@/plugins/sri';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/sri', () => {
  it('should apply default sri plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSRI()],
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
      plugins: [builderPluginSRI()],
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
      plugins: [builderPluginSRI()],
      builderConfig: {},
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBeUndefined();
  });
});
