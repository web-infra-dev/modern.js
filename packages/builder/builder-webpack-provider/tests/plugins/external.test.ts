import { describe, it, expect } from 'vitest';
import { PluginExternals } from '@/plugins/externals';
import { createStubBuilder } from '@/stub';

describe('plugins/external', () => {
  it('should add external config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginExternals()],
      builderConfig: {
        output: {
          externals: ['react', /@swc\/.*/],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.externals).toEqual(['react', /@swc\/.*/]);
  });
});
