import { join } from 'path';
import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import type { BuilderConfig } from '../src';
import { createBuilder } from '../src';
import { matchPlugins, unwrapConfig } from './helper';

const htmlMinifier = rstest.hoisted(() => ({ loadCount: 0 }));

// The factory only runs when the plugin imports `html-minifier-terser`, so
// `loadCount` tells whether it was loaded.
rstest.mock('html-minifier-terser', () => {
  htmlMinifier.loadCount++;
  return rstest.requireActual('html-minifier-terser');
});

const getHtmlMinify = async (config: BuilderConfig = {}) => {
  const rsbuild = await createBuilder({
    bundlerType: 'rspack',
    config,
    cwd: join(__dirname, '..'),
  });
  const htmlPlugins = matchPlugins(
    await unwrapConfig(rsbuild),
    'HtmlRspackPlugin',
  ) as unknown as { options: { minify?: unknown } }[];
  return htmlPlugins.map(plugin => plugin.options.minify);
};

describe('plugin-html-minifier-terser', () => {
  afterEach(() => {
    rstest.unstubAllEnvs();
  });

  it('should not load html-minifier-terser in development', async () => {
    rstest.stubEnv('NODE_ENV', 'development');

    expect(await getHtmlMinify()).toEqual([undefined]);
    expect(htmlMinifier.loadCount).toBe(0);
  });

  it('should not load html-minifier-terser when minify is disabled', async () => {
    rstest.stubEnv('NODE_ENV', 'production');

    const minify = await getHtmlMinify({ output: { minify: false } });
    expect(minify).toHaveLength(1);
    expect(minify[0]).not.toBeTypeOf('function');

    expect(await getHtmlMinify({ tools: { htmlPlugin: false } })).toEqual([]);
    expect(htmlMinifier.loadCount).toBe(0);
  });

  // Runs last: it loads html-minifier-terser, which stays cached afterwards.
  it('should minify html in production', async () => {
    rstest.stubEnv('NODE_ENV', 'production');

    const [minify] = await getHtmlMinify();
    expect(htmlMinifier.loadCount).toBe(1);
    expect(minify).toBeTypeOf('function');
    expect(
      await (minify as (html: string) => Promise<string>)(
        '<html>\n  <body>\n    <div  id="root" ></div>\n  </body>\n</html>',
      ),
    ).toBe('<html><body><div id="root"></div></body></html>');

    // Preserve the Modern.js-owned policies formerly exercised by Builder e2e.
    const [policy] = await getHtmlMinify({
      output: { charset: 'ascii', legalComments: 'none' },
      performance: { removeConsole: ['warn'] },
    });
    const html =
      '<!-- keep --><style>.a { color: red; }</style><script>console.warn("warn");console.info("info");window.message="你好";</script>';
    const result = await (policy as (html: string) => Promise<string>)(html);
    expect(result).toContain('<!-- keep -->');
    expect(result).toContain('<style>.a{color:red}</style>');
    expect(result).not.toContain('console.warn');
    expect(result).toContain('console.info');
    expect(result).not.toContain('你好');

    const [override] = await getHtmlMinify({
      tools: { htmlPlugin: { minify: { removeComments: true } } },
    });
    expect(
      await (override as (html: string) => Promise<string>)(
        '<!-- remove --><div>value</div>',
      ),
    ).toBe('<div>value</div>');
  });
});
