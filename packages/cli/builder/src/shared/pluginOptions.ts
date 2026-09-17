import { applyOptionsChain, isDev, logger } from '@modern-js/utils';
import type { PluginLessOptions } from '@rsbuild/plugin-less';
import type { PluginSassOptions } from '@rsbuild/plugin-sass';
import type { PluginSvgrOptions, SvgDefaultExport } from '@rsbuild/plugin-svgr';
import type { BuilderConfig } from '../types';

type BuilderToolsConfig = NonNullable<BuilderConfig['tools']>;

/**
 * Keys that only exist on the plugin-level options of `@rsbuild/plugin-less`.
 * less-loader options (`lessOptions`, `additionalData`, `sourceMap`, ...)
 * never use these names, so the presence of any of them tells which layer
 * the user configured.
 */
const LESS_PLUGIN_KEYS: ReadonlyArray<keyof PluginLessOptions> = [
  'lessLoaderOptions',
  'include',
  'exclude',
  'parallel',
];

/**
 * Same for `@rsbuild/plugin-sass`. Note that `rewriteUrls` is a plugin-level
 * option too and must be recognized here, otherwise a valid
 * `tools.sass: { rewriteUrls: false }` would be wrapped as loader options.
 */
const SASS_PLUGIN_KEYS: ReadonlyArray<keyof PluginSassOptions> = [
  'sassLoaderOptions',
  'include',
  'exclude',
  'rewriteUrls',
];

const warned = new Set<string>();

/** Reset the warn-once state. Only meant for unit tests. */
export const resetPluginOptionsWarnings = (): void => {
  warned.clear();
};

/**
 * Deprecation warnings are printed once per process and only in development,
 * so that `build` logs in CI stay clean.
 */
const warnOnceInDev = (key: string, message: string): void => {
  if (!isDev() || warned.has(key)) {
    return;
  }
  warned.add(key);
  logger.warn(message);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPluginLevelOptions = (
  value: unknown,
  pluginKeys: ReadonlyArray<string>,
): boolean => isPlainObject(value) && pluginKeys.some(key => key in value);

const isEmptyObject = (value: unknown): boolean =>
  isPlainObject(value) && Object.keys(value).length === 0;

/**
 * `tools.less` accepts either the full options of `@rsbuild/plugin-less`
 * or, for backward compatibility, the less-loader options directly
 * (object, function or array form). The legacy form is wrapped into
 * `lessLoaderOptions` so the generated bundler config stays unchanged.
 */
export const normalizeLessOptions = (
  less: BuilderToolsConfig['less'],
): PluginLessOptions => {
  if (isPluginLevelOptions(less, LESS_PLUGIN_KEYS)) {
    return less as PluginLessOptions;
  }

  if (less !== undefined && !isEmptyObject(less)) {
    warnOnceInDev(
      'tools.less',
      [
        '`tools.less` now accepts the full options of @rsbuild/plugin-less. Passing less-loader options directly is deprecated and will stop working in the next major version. Move them under `lessLoaderOptions`:',
        '  before: tools: { less: { lessOptions: { javascriptEnabled: true } } }',
        '  after:  tools: { less: { lessLoaderOptions: { lessOptions: { javascriptEnabled: true } } } }',
      ].join('\n'),
    );
  }

  return {
    lessLoaderOptions: less as PluginLessOptions['lessLoaderOptions'],
  };
};

/**
 * Same as {@link normalizeLessOptions} for `tools.sass`.
 */
export const normalizeSassOptions = (
  sass: BuilderToolsConfig['sass'],
): PluginSassOptions => {
  if (isPluginLevelOptions(sass, SASS_PLUGIN_KEYS)) {
    return sass as PluginSassOptions;
  }

  if (sass !== undefined && !isEmptyObject(sass)) {
    warnOnceInDev(
      'tools.sass',
      [
        '`tools.sass` now accepts the full options of @rsbuild/plugin-sass. Passing sass-loader options directly is deprecated and will stop working in the next major version. Move them under `sassLoaderOptions`:',
        '  before: tools: { sass: { sassOptions: { quietDeps: true } } }',
        '  after:  tools: { sass: { sassLoaderOptions: { sassOptions: { quietDeps: true } } } }',
      ].join('\n'),
    );
  }

  return {
    sassLoaderOptions: sass as PluginSassOptions['sassLoaderOptions'],
  };
};

/**
 * Merge user svgr options on top of the defaults. Top-level keys are shallow
 * merged; `svgrOptions` is merged one level deeper so that setting e.g.
 * `svgrOptions.icon` keeps the `exportType` derived from
 * `output.svgDefaultExport`, while an explicit `svgrOptions.exportType`
 * still overrides it.
 */
const mergeSvgrOptions = (
  target: PluginSvgrOptions,
  source: PluginSvgrOptions,
): PluginSvgrOptions => {
  const svgrOptions = source.svgrOptions
    ? { ...target.svgrOptions, ...source.svgrOptions }
    : target.svgrOptions;
  return Object.assign(target, source, { svgrOptions });
};

/**
 * Resolve the options passed to `@rsbuild/plugin-svgr`, or `false` when the
 * plugin should not be registered.
 *
 * `tools.svgr` takes precedence over the deprecated `output.disableSvgr` and
 * `output.svgDefaultExport`; the two legacy options keep working when
 * `tools.svgr` is not set.
 */
export const resolveSvgrOptions = ({
  svgr,
  disableSvgr,
  svgDefaultExport,
}: {
  svgr: BuilderToolsConfig['svgr'];
  disableSvgr?: boolean;
  svgDefaultExport?: SvgDefaultExport;
}): PluginSvgrOptions | false => {
  if (disableSvgr !== undefined) {
    // `true` disables SVGR, `false` is the default: the two need different hints.
    warnOnceInDev(
      'output.disableSvgr',
      disableSvgr
        ? '`output.disableSvgr` is deprecated and will be removed in the next major version. Use `tools: { svgr: false }` instead.'
        : '`output.disableSvgr` is deprecated and will be removed in the next major version. SVGR is enabled by default, so `output.disableSvgr: false` can be removed (or use `tools: { svgr: {} }` to keep it explicit).',
    );
  }

  if (svgDefaultExport !== undefined) {
    warnOnceInDev(
      'output.svgDefaultExport',
      [
        '`output.svgDefaultExport` is deprecated and will be removed in the next major version. Use `tools.svgr.svgrOptions.exportType` instead:',
        "  before: output: { svgDefaultExport: 'component' }",
        "  after:  tools: { svgr: { svgrOptions: { exportType: 'default' } } }",
        "  ('url' maps to exportType: 'named')",
      ].join('\n'),
    );
  }

  if (svgr === false) {
    return false;
  }

  // `output.disableSvgr` only applies when `tools.svgr` is not set explicitly.
  if (svgr === undefined && disableSvgr) {
    return false;
  }

  const defaults: PluginSvgrOptions = {
    mixedImport: true,
    svgrOptions: {
      exportType: svgDefaultExport === 'component' ? 'default' : 'named',
    },
  };

  return applyOptionsChain(
    defaults,
    svgr,
    undefined,
    mergeSvgrOptions as typeof Object.assign,
  );
};
