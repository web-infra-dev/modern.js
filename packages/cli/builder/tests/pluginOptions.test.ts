import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import type { BuilderConfig } from '../src';
import { findLoaderUses, getRules } from './helper';

describe('plugin option migration warnings', () => {
  // Each test gets the warn-once state of a new CLI process.
  beforeEach(() => {
    rs.resetModules();
  });
  afterEach(() => {
    rs.unstubAllEnvs();
    rs.restoreAllMocks();
  });

  it('hints that the default output.disableSvgr setting can be removed', async () => {
    rs.stubEnv('MODERN_ARGV', 'node modern dev');
    const { parseRspackConfig } = await import('../src');
    const { logger } = await import('@modern-js/utils');
    const warn = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    await parseRspackConfig(
      { output: { disableSvgr: false } },
      { cwd: __dirname },
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('can be removed'),
    );
  });

  it.each(['dev', 'start', 'build'])(
    'reports migration hints once in %s when appropriate',
    async command => {
      rs.stubEnv('MODERN_ARGV', `node modern ${command}`);
      rs.stubEnv('NODE_ENV', 'development');
      const { parseRspackConfig } = await import('../src');
      const { logger } = await import('@modern-js/utils');
      const warn = rs.spyOn(logger, 'warn').mockImplementation(() => {});
      const parse = (config: BuilderConfig) =>
        parseRspackConfig(config, { cwd: __dirname });

      await parse({});
      await parse({
        tools: { less: {}, sass: { rewriteUrls: false }, svgr: {} },
      });
      expect(warn).not.toHaveBeenCalled();
      const legacy = {
        tools: { less: { lessOptions: {} }, sass: { sassOptions: {} } },
        output: { svgDefaultExport: 'component', disableSvgr: true },
      } satisfies BuilderConfig;
      const mixed = {
        parallel: true,
        lessOptions: { javascriptEnabled: false },
      };
      for (let i = 0; i < 2; i++) {
        await parse(legacy);
        await parse({ tools: { less: mixed } });
      }
      if (command === 'build') {
        expect(warn).not.toHaveBeenCalled();
        return;
      }
      expect(warn).toHaveBeenCalledTimes(5);
      for (const hint of [
        'lessLoaderOptions',
        'sassLoaderOptions',
        'output.svgDefaultExport',
        'output.disableSvgr',
      ]) {
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(hint));
      }
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/\(parallel\).*\(lessOptions\).*ignored/),
      );
    },
  );
});

describe('tools.less / tools.sass / tools.svgr in the bundler config', () => {
  beforeEach(() => {
    rs.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it('should mark every less-loader as parallel with tools.less.parallel', async () => {
    const before = findLoaderUses(await getRules({}, 'a.less'), /less-loader/);
    expect(before.length).toBeGreaterThan(0);
    expect(before.every(use => !use.parallel)).toBe(true);

    const after = findLoaderUses(
      await getRules({ tools: { less: { parallel: true } } }, 'a.less'),
      /less-loader/,
    );
    expect(after.length).toBe(before.length);
    expect(after.every(use => use.parallel === true)).toBe(true);
  });

  it.each([
    { lessOptions: { javascriptEnabled: false } },
    { lessLoaderOptions: { lessOptions: { javascriptEnabled: false } } },
  ])('maps legacy and current options to the less loader', async less => {
    const uses = findLoaderUses(
      await getRules({ tools: { less } }, 'a.less'),
      /less-loader/,
    );
    expect(uses.length).toBeGreaterThan(0);
    expect(
      uses.every(use => use.options.lessOptions.javascriptEnabled === false),
    ).toBe(true);
  });

  it('applies a legacy Less loader options function', async () => {
    const uses = findLoaderUses(
      await getRules(
        {
          tools: {
            less: options => {
              options.additionalData = '@color: red;';
            },
          },
        },
        'a.less',
      ),
      /less-loader/,
    );
    expect(uses.length).toBeGreaterThan(0);
    expect(
      uses.every(use => use.options.additionalData === '@color: red;'),
    ).toBe(true);
  });

  it('applies a legacy array of Sass loader options', async () => {
    const uses = findLoaderUses(
      await getRules(
        {
          tools: {
            sass: [
              options => {
                options.additionalData = '$color: red;';
              },
            ],
          },
        },
        'a.scss',
      ),
      /sass-loader/,
    );
    expect(uses.length).toBeGreaterThan(0);
    expect(
      uses.every(use => use.options.additionalData === '$color: red;'),
    ).toBe(true);
  });

  it('merges chained SVGR options with the legacy export type', async () => {
    const uses = findLoaderUses(
      await getRules(
        {
          output: { svgDefaultExport: 'component' },
          tools: {
            svgr: [
              { svgrOptions: { icon: true } },
              { svgrOptions: { svgo: false } },
              options => {
                options.svgrOptions!.ref = true;
              },
            ],
          },
        },
        'a.svg',
      ),
      /plugin-svgr\/dist\/loader/,
    );
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) {
      expect(use.options).toMatchObject({
        exportType: 'default',
        icon: true,
        svgo: false,
        ref: true,
      });
    }
  });

  it('should pass tools.sass.rewriteUrls to the sass plugin', async () => {
    const before = findLoaderUses(
      await getRules({}, 'a.scss'),
      /resolve-url-loader/,
    );
    expect(before.length).toBeGreaterThan(0);

    const after = findLoaderUses(
      await getRules({ tools: { sass: { rewriteUrls: false } } }, 'a.scss'),
      /resolve-url-loader/,
    );
    expect(after.length).toBe(0);
  });

  it('should mark the svgr loader as parallel with tools.svgr.parallel', async () => {
    const before = findLoaderUses(
      await getRules({}, 'a.svg'),
      /plugin-svgr\/dist\/loader/,
    );
    expect(before.length).toBeGreaterThan(0);
    expect(before.every(use => !use.parallel)).toBe(true);
    // Bare SVG imports expose a named component alongside the default asset URL.
    expect(before.some(use => use.options.exportType === 'named')).toBe(true);

    const after = findLoaderUses(
      await getRules({ tools: { svgr: { parallel: true } } }, 'a.svg'),
      /plugin-svgr\/dist\/loader/,
    );
    expect(after.length).toBe(before.length);
    expect(after.every(use => use.parallel === true)).toBe(true);
  });

  it('should prefer tools.svgr.svgrOptions.exportType over output.svgDefaultExport', async () => {
    const uses = findLoaderUses(
      await getRules(
        {
          output: { svgDefaultExport: 'url' },
          tools: { svgr: { svgrOptions: { exportType: 'default' } } },
        },
        'a.svg',
      ),
      /plugin-svgr\/dist\/loader/,
    );
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.every(use => use.options.exportType === 'default')).toBe(true);
  });

  it('should disable svgr with tools.svgr: false and re-enable it with an explicit object', async () => {
    expect(
      findLoaderUses(
        await getRules({ tools: { svgr: false } }, 'a.svg'),
        /plugin-svgr\/dist\/loader/,
      ),
    ).toHaveLength(0);
    expect(
      findLoaderUses(
        await getRules({ output: { disableSvgr: true } }, 'a.svg'),
        /plugin-svgr\/dist\/loader/,
      ),
    ).toHaveLength(0);
    expect(
      findLoaderUses(
        await getRules(
          { output: { disableSvgr: true }, tools: { svgr: {} } },
          'a.svg',
        ),
        /plugin-svgr\/dist\/loader/,
      ).length,
    ).toBeGreaterThan(0);
  });
});
