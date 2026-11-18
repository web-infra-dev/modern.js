import { afterEach, describe, expect, it, rs } from '@rstest/core';
import postcss, { type AcceptedPlugin } from 'postcss';
import type { BuilderConfig } from '../src';
import { findLoaderUses, getRules } from './helper';

async function getPostcssPlugins(
  config: BuilderConfig,
): Promise<AcceptedPlugin[]> {
  const rules = await getRules(config, 'a.css');
  const [loader] = findLoaderUses(rules, /postcss-loader/);
  return loader.options.postcssOptions.plugins;
}

describe('legacy PostCSS compatibility', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it.each([
    ['chrome 87', '(min-width: 100px)'],
    ['chrome 110', '(width >= 100px)'],
  ] as const)(
    'selects media range support for %s',
    async (browser, expectedQuery) => {
      const plugins = await getPostcssPlugins({
        output: { overrideBrowserslist: [browser] },
      });
      const { css } = await postcss(plugins).process(
        '@media (width >= 100px) { .a { color: red } }',
        { from: undefined },
      );
      expect(css).toContain(expectedQuery);
      expect(plugins).toContainEqual(
        expect.objectContaining({
          postcssPlugin: 'autoprefixer',
          options: expect.objectContaining({ overrideBrowserslist: [browser] }),
        }),
      );
    },
  );

  it('allows an explicit PostCSS plugin list to replace the compatibility defaults', async () => {
    const plugin = { postcssPlugin: 'custom-postcss-plugin' };
    const plugins = await getPostcssPlugins({
      tools: { postcss: { postcssOptions: { plugins: [plugin] } } },
    });
    expect(plugins).toEqual([plugin]);
  });

  it.each(['development', 'production'])(
    'minifies injected styles only in production (%s)',
    async mode => {
      rs.stubEnv('NODE_ENV', mode);
      const plugins = await getPostcssPlugins({
        output: { injectStyles: true },
      });
      const { css } = await postcss(plugins).process(
        '/* ordinary comment */ .a { color: red; }',
        { from: undefined },
      );
      expect(css.includes('/* ordinary comment */')).toBe(
        mode === 'development',
      );
    },
  );

  it('uses Lightning CSS alone unless the user also configures PostCSS', async () => {
    const rules = await getRules(
      { tools: { lightningcssLoader: true } },
      'a.css',
    );
    expect(findLoaderUses(rules, /lightningcss-loader/).length).toBeGreaterThan(
      0,
    );
    expect(findLoaderUses(rules, /postcss-loader/)).toHaveLength(0);

    const plugin = { postcssPlugin: 'custom-postcss-plugin', AtRule: {} };
    const combined = await getRules(
      {
        tools: {
          lightningcssLoader: true,
          postcss: { postcssOptions: { plugins: [plugin] } },
        },
      },
      'a.css',
    );
    expect(
      findLoaderUses(combined, /lightningcss-loader/).length,
    ).toBeGreaterThan(0);
    expect(
      findLoaderUses(combined, /postcss-loader/)[0].options.postcssOptions
        .plugins,
    ).toEqual([plugin]);
  });
});
