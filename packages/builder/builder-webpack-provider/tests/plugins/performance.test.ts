import { describe, it, expect } from 'vitest';
import { builderPluginPerformance } from '@/plugins/performance';
import { createStubBuilder } from '@/stub';

describe('plugins/performance', () => {
  it('should not set profile configuration', async () => {
    const builder1 = await createStubBuilder();
    const config1 = await builder1.unwrapWebpackConfig();

    expect(config1.profile).toBeFalsy();

    const builder2 = await createStubBuilder({
      plugins: [builderPluginPerformance()],
      builderConfig: {
        performance: {
          profile: false,
        },
      },
    });
    const config2 = await builder2.unwrapWebpackConfig();
    expect(config2.profile).toBeFalsy();
  });

  it('should capture timing information for each module', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginPerformance()],
      builderConfig: {
        performance: {
          profile: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.profile).toBeTruthy();
  });
});
