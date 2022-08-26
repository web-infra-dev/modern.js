import { expect, describe, it } from 'vitest';
import { PluginMarkdown } from '../../src/plugins/markdown';
import { createStubBuilder } from '../utils/builder';

describe('plugins/markdown', () => {
  it('should add markdown rules properly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginMarkdown()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
