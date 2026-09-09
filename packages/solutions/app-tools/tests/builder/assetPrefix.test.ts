import { type RspackChain, createRsbuild } from '@rsbuild/core';
import { describe, expect, it } from '@rstest/core';
import { createPublicPattern } from '../../src/builder/generator/createCopyPattern';
import { builderPluginAdapterHtml } from '../../src/builder/shared/builderPlugins/adapterHtml';
import type { BuilderOptions } from '../../src/builder/shared/types';
import type { AppNormalizedConfig } from '../../src/types';
import type { AppToolsContext } from '../../src/types/plugin';

const appContext = {
  appDirectory: __dirname,
  htmlTemplates: {},
} as AppToolsContext;
const normalizedConfig = {
  source: {},
  html: {},
} as AppNormalizedConfig;

describe('asset prefix templates', () => {
  it.each([
    { publicPath: '/assets/', expected: '/assets' },
    { publicPath: undefined, expected: '' },
    { publicPath: () => '/dynamic/', expected: '' },
  ])('should handle publicPath %j', async ({ publicPath, expected }) => {
    const pattern = createPublicPattern(appContext, normalizedConfig, {
      output: { get: () => publicPath },
    } as unknown as RspackChain);

    expect(
      pattern.transform(
        Buffer.from('<%= assetPrefix %>/logo.png'),
        'index.html',
      ),
    ).toBe(`${expected}/logo.png`);
    const asset = Buffer.from('<%= assetPrefix %>');
    expect(pattern.transform(asset, 'file.txt')).toBe(asset);

    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          {
            name: 'test-public-path',
            setup(api) {
              api.modifyBundlerChain(chain => {
                chain.output.publicPath(publicPath);
              });
            },
          },
          builderPluginAdapterHtml({
            appContext,
            normalizedConfig,
          } as BuilderOptions),
        ],
      },
    });
    const [config] = await rsbuild.initConfigs();
    expect(decodeURIComponent(JSON.stringify(config.entry))).toContain(
      `window.__assetPrefix__ = '${expected}';`,
    );
  });
});
