import { describe, it, expect } from 'vitest';
import { PluginExternal } from '../../src/plugins/external';
import { createStubBuilder } from '../../src/stub';

describe('plugins/external', () => {
  it('should add external config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginExternal()],
      builderConfig: {
        output: {
          external: ['react', /@swc\/.*/],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.externals).toEqual(['react', /@swc\/.*/]);
  });
});
