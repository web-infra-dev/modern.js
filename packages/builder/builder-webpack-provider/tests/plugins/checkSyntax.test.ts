import { describe, expect, it } from 'vitest';
import { builderPluginCheckSyntax } from '@/plugins/checkSyntax';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/checkSyntax', () => {
  it('should set WebpackCheckSyntax plugin', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [builderPluginCheckSyntax()],
      builderConfig: {
        security: {
          checkSyntax: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
