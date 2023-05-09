import { expect, describe, it } from 'vitest';
import { builderPluginEntry } from '@builder/plugins/entry';
import { builderPluginHtml } from '@builder/plugins/html';
import { createBuilder } from '../helper';
import { builderPluginPug } from '@/plugins/pug';

describe('plugins/pug', () => {
  it('should add pug correctly when tools.pug is used', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml(), builderPluginPug()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      builderConfig: {
        html: {
          template: 'bar.html',
          templateByEntries: { main: 'foo.pug' },
        },
        tools: {
          pug: {
            pretty: true,
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
