import mergeWith from 'lodash.mergewith';
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
    | 'babel'
    | 'postcss'
    | 'autoprefixer'
    | 'lodash'
    | 'tsLoader'
    | 'terser'
    | 'minifyCss'
    | 'esbuild'
  > {
  webpack: ToolsConfig['webpack'] | Array<NonNullable<ToolsConfig['webpack']>>;
  babel: ToolsConfig['babel'] | Array<NonNullable<ToolsConfig['babel']>>;
  postcss: ToolsConfig['postcss'] | Array<NonNullable<ToolsConfig['postcss']>>;
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
  mergeWith({}, ...configs, (target: any, source: any) => {
    if (Array.isArray(target) && Array.isArray(source)) {
      return [...target, ...source];
    }
    if (isFunction(source)) {
      return Array.isArray(target)
        ? [...target, source]
        : [target, source].filter(Boolean);
    }
    return undefined;
  });
