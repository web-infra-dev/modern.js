import {
  applyOptionsChain,
  getCoreJsVersion,
  isBeyondReact17,
  logger,
} from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/builder-webpack-provider';
import { merge } from '@modern-js/utils/compiled/lodash';
import {
  BuilderTarget,
  getBrowserslistWithDefault,
  getDefaultStyledComponentsConfig,
  isUsingHMR,
} from '@modern-js/builder-shared';
import { Extensions } from '@modern-js/swc-plugins';
import { getDefaultSwcConfig } from './plugin';
import {
  ObjPluginSwcOptions,
  OuterExtensions,
  PluginSwcOptions,
  TransformConfig,
} from './types';

/**
 * Determin react runtime mode based on react version
 */
export function determinePresetReact(
  root: string,
  pluginConfig: ObjPluginSwcOptions,
) {
  const presetReact =
    pluginConfig.presetReact || (pluginConfig.presetReact = {});

  presetReact.runtime ??= isBeyondReact17(root) ? 'automatic' : 'classic';
}

const BUILDER_SWC_DEBUG_MODE = 'BUILDER_SWC_DEBUG_MODE';
export function isDebugMode(): boolean {
  return process.env[BUILDER_SWC_DEBUG_MODE] !== undefined;
}

export function checkUseMinify(
  options: ObjPluginSwcOptions,
  config: NormalizedConfig,
  isProd: boolean,
) {
  return (
    isProd &&
    !config.output.disableMinimize &&
    (options.jsMinify !== false ||
      options.cssMinify !== false ||
      options.minify ||
      options.jsc?.minify)
  );
}

const PLUGIN_ONLY_OPTIONS: (keyof ObjPluginSwcOptions)[] = [
  'presetReact',
  'presetEnv',
  'jsMinify',
  'cssMinify',
];

export function removeUselessOptions(
  obj: ObjPluginSwcOptions,
): TransformConfig {
  const output = { ...obj };

  for (const key of PLUGIN_ONLY_OPTIONS) {
    delete output[key];
  }

  return output;
}

export async function finalizeConfig(
  userConfig: PluginSwcOptions,
  pluginConfig: TransformConfig,
): Promise<ObjPluginSwcOptions> {
  const isUsingFnOptions = typeof userConfig === 'function';

  const objConfig = isUsingFnOptions ? {} : userConfig;

  // apply swc default config
  let swcConfig: TransformConfig = merge(
    getDefaultSwcConfig(),
    pluginConfig,
    objConfig,
  );

  if (isUsingFnOptions) {
    const { lodash: _ } = await import('@modern-js/utils');
    const ret = userConfig(swcConfig, {
      mergeConfig: _.merge,
      setConfig: _.set,
    });

    if (ret) {
      swcConfig = ret;
    }
  }

  return swcConfig;
}

export async function applyPluginConfig(
  rawOptions: PluginSwcOptions,
  target: BuilderTarget,
  isProd: boolean,
  builderConfig: NormalizedConfig,
  rootPath: string,
): Promise<ObjPluginSwcOptions> {
  const isUsingFnOptions = typeof rawOptions === 'function';

  // if using function type config, create an empty config
  // and then invoke function with this config
  const pluginOptions = isUsingFnOptions ? {} : rawOptions;

  determinePresetReact(rootPath, pluginOptions);

  const swc = {
    jsc: {
      transform: {
        react: {
          refresh: isUsingHMR(builderConfig, isProd, target),
        },
      },
    },
    env: pluginOptions.presetEnv || {},
    extensions: { ...pluginOptions.extensions },
    cwd: rootPath,
  } satisfies TransformConfig;

  if (pluginOptions.presetReact) {
    swc.jsc.transform.react = {
      ...swc.jsc.transform.react,
      ...pluginOptions.presetReact,
    };
  }

  const { polyfill } = builderConfig.output;
  if (swc.env.mode === undefined && polyfill !== 'ua' && polyfill !== 'off') {
    swc.env.mode = polyfill;
  }

  if (!swc.env.coreJs) {
    const CORE_JS_PATH = require.resolve('core-js/package.json');
    swc.env.coreJs = getCoreJsVersion(CORE_JS_PATH);
  }

  // If `targets` is not specified manually, we get `browserslist` from project.
  if (!swc.env.targets) {
    swc.env.targets = await getBrowserslistWithDefault(
      rootPath,
      builderConfig,
      target,
    );
  }

  const isSSR = target === 'node';

  if (
    builderConfig.tools.styledComponents !== false &&
    swc.extensions?.styledComponents !== false
  ) {
    const styledComponentsOptions = applyOptionsChain(
      getDefaultStyledComponentsConfig(isProd, isSSR),
      builderConfig.tools.styledComponents,
    );
    swc.extensions.styledComponents = {
      ...styledComponentsOptions,
      ...(typeof swc.extensions.styledComponents === 'object'
        ? swc.extensions?.styledComponents
        : {}),
    };
  }

  const extensions: Extensions | OuterExtensions =
    // eslint-disable-next-line no-multi-assign
    (swc.extensions ??= {});

  if (builderConfig.source?.transformImport) {
    extensions.pluginImport ??= [];
    extensions.pluginImport.push(...builderConfig.source.transformImport);
  }

  /**
   * SWC can't use latestDecorator in TypeScript file for now
   */
  if (builderConfig.output.enableLatestDecorators) {
    logger.warn('Cannot use latestDecorator in SWC compiler.');
  }

  return await finalizeConfig(rawOptions, swc);
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('finalize options', async () => {
    const pluginConfig: ObjPluginSwcOptions = {
      cssMinify: true,
    };

    const output = removeUselessOptions(await finalizeConfig(pluginConfig, {}));
    expect(pluginConfig).toHaveProperty('cssMinify');
    expect(Reflect.ownKeys(output).includes('cssMinify')).toBeFalsy();
  });
}
