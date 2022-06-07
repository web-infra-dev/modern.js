import { mergeWith } from '@modern-js/utils/lodash';
import { isFunction } from '@modern-js/utils';
import { UserConfig, SourceConfig, ToolsConfig } from '.';

export interface NormalizedSourceConfig
  extends Omit<SourceConfig, 'alias' | 'moduleScopes'> {
  alias: SourceConfig['alias'] | Array<SourceConfig['alias']>;
  moduleScopes:
    | SourceConfig['moduleScopes']
    | Array<SourceConfig['moduleScopes']>;
}

export interface NormalizedToolsConfig
  extends Omit<
    ToolsConfig,
    | 'webpack'
    | 'webpackChain'
    | 'babel'
    | 'postcss'
    | 'autoprefixer'
    | 'lodash'
    | 'tsLoader'
    | 'terser'
    | 'minifyCss'
    | 'esbuild'
    | 'styledComponents'
  > {
  webpack: ToolsConfig['webpack'] | Array<NonNullable<ToolsConfig['webpack']>>;
  webpackChain:
    | ToolsConfig['webpackChain']
    | Array<NonNullable<ToolsConfig['webpackChain']>>;
  babel: ToolsConfig['babel'] | Array<NonNullable<ToolsConfig['babel']>>;
  postcss: ToolsConfig['postcss'] | Array<NonNullable<ToolsConfig['postcss']>>;
  styledComponents:
    | ToolsConfig['styledComponents']
    | Array<NonNullable<ToolsConfig['styledComponents']>>;
  autoprefixer:
    | ToolsConfig['autoprefixer']
    | Array<NonNullable<ToolsConfig['autoprefixer']>>;
  lodash: ToolsConfig['lodash'] | Array<ToolsConfig['lodash']>;
  tsLoader:
    | ToolsConfig['tsLoader']
    | Array<NonNullable<ToolsConfig['tsLoader']>>;
  terser: ToolsConfig['terser'] | Array<NonNullable<ToolsConfig['terser']>>;
  minifyCss:
    | ToolsConfig['minifyCss']
    | Array<NonNullable<ToolsConfig['minifyCss']>>;
  esbuild: ToolsConfig['esbuild'] | Array<NonNullable<ToolsConfig['esbuild']>>;
}

export interface NormalizedConfig
  extends Omit<Required<UserConfig>, 'source' | 'tools'> {
  source: NormalizedSourceConfig;
  tools: NormalizedToolsConfig;
  cliOptions?: Record<string, any>;
  _raw: UserConfig;
}

/**
 * merge configuration from  modern.config.js and plugins.
 *
 * @param configs - Configuration from modern.config.ts or plugin's config hook.
 * @returns - normalized user config.
 */
export const mergeConfig = (
  configs: Array<UserConfig | NormalizedConfig>,
): NormalizedConfig =>
  mergeWith({}, ...configs, (target: any, source: any, key: string) => {
    // Do not use the following merge logic for source.designSystem and tools.tailwind(css)
    if (
      key === 'designSystem' ||
      key === 'tailwind' ||
      key === 'tailwindcss' ||
      key === 'devServer'
    ) {
      return mergeWith({}, target ?? {}, source ?? {});
    }

    if (Array.isArray(target)) {
      if (Array.isArray(source)) {
        return [...target, ...source];
      } else {
        return typeof source !== 'undefined' ? [...target, source] : target;
      }
    } else if (isFunction(source)) {
      return typeof target !== 'undefined' ? [target, source] : [source];
    }

    return undefined;
  });
