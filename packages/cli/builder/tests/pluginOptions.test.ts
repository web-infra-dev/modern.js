import { join } from 'path';
import { logger } from '@modern-js/utils';
import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { createBuilder } from '../src';
import {
  normalizeLessOptions,
  normalizeSassOptions,
  resetPluginOptionsWarnings,
  resolveSvgrOptions,
} from '../src/shared/pluginOptions';
import type { BuilderConfig } from '../src/types';
import { matchRules } from './helper';

const cwd = join(__dirname, '..');

type LoaderUse = { loader?: string; options?: any; parallel?: boolean };

/**
 * Collect every loader `use` item whose loader path matches `pattern`.
 * Loader paths are built with `path.join`, so normalize the separators
 * before matching to keep the assertions valid on Windows.
 */
function findLoaderUses(value: unknown, pattern: RegExp): LoaderUse[] {
  const result: LoaderUse[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (
      typeof obj.loader === 'string' &&
      pattern.test(obj.loader.replace(/\\/g, '/'))
    ) {
      result.push(obj as LoaderUse);
    }
    Object.values(obj).forEach(walk);
  };
  walk(value);
  return result;
}

/**
 * Rules contain per-instance closures (loader callbacks), so two builders can
 * never be compared by reference. Compare their serialized form instead,
 * which is what `modern inspect` writes to disk.
 */
function serializeRules(rules: unknown): string {
  return JSON.stringify(
    rules,
    (_key, value) => {
      if (value instanceof RegExp) {
        return value.toString();
      }
      if (typeof value === 'function') {
        return `[Function ${value.name || 'anonymous'}]`;
      }
      return value;
    },
    2,
  );
}

async function getRules(config: BuilderConfig, testFile: string) {
  const builder = await createBuilder({ bundlerType: 'rspack', config, cwd });
  const {
    origin: { bundlerConfigs },
  } = await builder.inspectConfig();
  return matchRules({ config: bundlerConfigs[0], testFile });
}

describe('normalizeLessOptions / normalizeSassOptions', () => {
  let warn: ReturnType<typeof rs.spyOn>;

  beforeEach(() => {
    resetPluginOptionsWarnings();
    // hints are gated on the CLI command, not on NODE_ENV
    rs.stubEnv('MODERN_ARGV', 'node modern dev');
    warn = rs.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    rs.unstubAllEnvs();
    warn.mockRestore();
  });

  it('should keep the legacy shape when tools.less is not set', () => {
    expect(normalizeLessOptions(undefined)).toEqual({
      lessLoaderOptions: undefined,
    });
    expect(normalizeSassOptions(undefined)).toEqual({
      sassLoaderOptions: undefined,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should wrap less-loader options and warn once in dev', () => {
    const loaderOptions = { lessOptions: { javascriptEnabled: false } };
    expect(normalizeLessOptions(loaderOptions)).toEqual({
      lessLoaderOptions: loaderOptions,
    });
    normalizeLessOptions(loaderOptions);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('lessLoaderOptions');
  });

  it('should wrap function and array forms without changing them', () => {
    const fn = (config: any) => {
      config.sourceMap = true;
    };
    expect(normalizeLessOptions(fn)).toEqual({ lessLoaderOptions: fn });
    expect(normalizeSassOptions([fn])).toEqual({ sassLoaderOptions: [fn] });
  });

  it('should not warn for an empty object', () => {
    expect(normalizeLessOptions({})).toEqual({ lessLoaderOptions: {} });
    expect(normalizeSassOptions({})).toEqual({ sassLoaderOptions: {} });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should pass plugin-level options through untouched', () => {
    const less = {
      parallel: true,
      exclude: /node_modules/,
      lessLoaderOptions: { lessOptions: { math: 'always' as const } },
    };
    expect(normalizeLessOptions(less)).toBe(less);

    // `rewriteUrls` only exists on the plugin level and must be recognized.
    const sass = { rewriteUrls: false };
    expect(normalizeSassOptions(sass)).toBe(sass);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should treat a mixed object as plugin-level options and warn about ignored keys', () => {
    const mixed = { parallel: true, lessOptions: { javascriptEnabled: true } };
    expect(normalizeLessOptions(mixed as any)).toBe(mixed);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('(parallel)');
    expect(warn.mock.calls[0][0]).toContain('(lessOptions)');
    expect(warn.mock.calls[0][0]).toContain('ignored');
  });

  it('should also warn for the start command', () => {
    rs.stubEnv('MODERN_ARGV', 'node modern start');
    normalizeLessOptions({ lessOptions: {} });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should stay silent for build even with NODE_ENV=development', () => {
    rs.stubEnv('MODERN_ARGV', 'node modern build');
    rs.stubEnv('NODE_ENV', 'development');
    normalizeLessOptions({ lessOptions: {} });
    normalizeSassOptions({ sassOptions: {} });
    normalizeLessOptions({ parallel: true, lessOptions: {} } as any);
    resolveSvgrOptions({
      svgr: undefined,
      disableSvgr: true,
      svgDefaultExport: 'component',
    });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('resolveSvgrOptions', () => {
  let warn: ReturnType<typeof rs.spyOn>;

  beforeEach(() => {
    resetPluginOptionsWarnings();
    // hints are gated on the CLI command, not on NODE_ENV
    rs.stubEnv('MODERN_ARGV', 'node modern dev');
    warn = rs.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    rs.unstubAllEnvs();
    warn.mockRestore();
  });

  it('should keep the previous defaults when nothing is configured', () => {
    expect(resolveSvgrOptions({ svgr: undefined })).toEqual({
      mixedImport: true,
      svgrOptions: { exportType: 'named' },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should still honor the deprecated output options and warn', () => {
    expect(
      resolveSvgrOptions({ svgr: undefined, svgDefaultExport: 'component' }),
    ).toEqual({
      mixedImport: true,
      svgrOptions: { exportType: 'default' },
    });
    expect(resolveSvgrOptions({ svgr: undefined, disableSvgr: true })).toBe(
      false,
    );
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toContain('output.svgDefaultExport');
    expect(warn.mock.calls[1][0]).toContain('output.disableSvgr');
  });

  it('should give a different hint for output.disableSvgr: false', () => {
    expect(resolveSvgrOptions({ svgr: undefined, disableSvgr: false })).toEqual(
      {
        mixedImport: true,
        svgrOptions: { exportType: 'named' },
      },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('can be removed');
    expect(warn.mock.calls[0][0]).not.toContain('svgr: false');
  });

  it('should disable the plugin with tools.svgr: false', () => {
    expect(resolveSvgrOptions({ svgr: false })).toBe(false);
  });

  it('should re-enable the plugin when tools.svgr is set explicitly', () => {
    expect(resolveSvgrOptions({ svgr: {}, disableSvgr: true })).toEqual({
      mixedImport: true,
      svgrOptions: { exportType: 'named' },
    });
  });

  it('should keep the derived exportType when only parallel is set', () => {
    expect(
      resolveSvgrOptions({
        svgr: { parallel: true },
        svgDefaultExport: 'component',
      }),
    ).toEqual({
      mixedImport: true,
      parallel: true,
      svgrOptions: { exportType: 'default' },
    });
  });

  it('should merge svgrOptions one level deep', () => {
    expect(
      resolveSvgrOptions({
        svgr: { svgrOptions: { icon: true } },
        svgDefaultExport: 'component',
      }),
    ).toEqual({
      mixedImport: true,
      svgrOptions: { exportType: 'default', icon: true },
    });
  });

  it('should let tools.svgr.svgrOptions.exportType win', () => {
    expect(
      resolveSvgrOptions({
        svgr: { svgrOptions: { exportType: 'default' } },
        svgDefaultExport: 'url',
      }),
    ).toEqual({
      mixedImport: true,
      svgrOptions: { exportType: 'default' },
    });
  });

  it('should keep merging svgrOptions across an array chain', () => {
    expect(
      resolveSvgrOptions({
        svgr: [
          { svgrOptions: { icon: true } },
          { svgrOptions: { svgo: false } },
          config => {
            config.svgrOptions!.ref = true;
          },
        ],
        svgDefaultExport: 'component',
      }),
    ).toEqual({
      mixedImport: true,
      svgrOptions: {
        exportType: 'default',
        icon: true,
        svgo: false,
        ref: true,
      },
    });
  });

  it('should support function and array forms', () => {
    expect(
      resolveSvgrOptions({
        svgr: [
          { exclude: /icons/ },
          config => {
            config.parallel = true;
          },
        ],
      }),
    ).toEqual({
      mixedImport: true,
      exclude: /icons/,
      parallel: true,
      svgrOptions: { exportType: 'named' },
    });
  });
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

  it('should generate the same rules for the legacy and the plugin form', async () => {
    const legacy = await getRules(
      { tools: { less: { lessOptions: { javascriptEnabled: false } } } },
      'a.less',
    );
    const plugin = await getRules(
      {
        tools: {
          less: {
            lessLoaderOptions: { lessOptions: { javascriptEnabled: false } },
          },
        },
      },
      'a.less',
    );
    expect(serializeRules(plugin)).toBe(serializeRules(legacy));

    const lessUses = findLoaderUses(plugin, /less-loader/);
    expect(lessUses.length).toBeGreaterThan(0);
    expect(
      lessUses.every(
        use => use.options.lessOptions.javascriptEnabled === false,
      ),
    ).toBe(true);
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
