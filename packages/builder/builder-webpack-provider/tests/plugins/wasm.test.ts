import { describe, it, expect } from 'vitest';
import { createStubBuilder } from '@/stub';
import { builderPluginWasm } from '@/plugins/wasm';

describe('plugins/wasm', () => {
  it('should add configs for wasm', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginWasm()],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to modify dist path of wasm files', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginWasm()],
      builderConfig: {
        output: {
          distPath: {
            wasm: 'foo',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
