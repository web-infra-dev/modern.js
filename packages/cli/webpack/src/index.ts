import webpack from 'webpack';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  ClientWebpackConfig,
  ModernWebpackConfig,
  NodeWebpackConfig,
} from './config';

export { webpack };
export type {
  Compiler,
  Configuration,
  MultiCompiler,
  StatsCompilation,
} from 'webpack';
export { BaseWebpackConfig } from './config/base';
export { JS_REGEX, TS_REGEX } from './utils/constants';
export { mergeRegex } from './utils/mergeRegex';

export enum WebpackConfigTarget {
  CLIENT,
  NODE,
  MODERN,
}

export const getWebpackConfig = (
  target: WebpackConfigTarget,
  appContext: IAppContext,
  resolvedConfig: NormalizedConfig,
) => {
  let Config = null;

  switch (target) {
    case WebpackConfigTarget.CLIENT:
      Config = ClientWebpackConfig;
      break;
    case WebpackConfigTarget.MODERN:
      Config = ModernWebpackConfig;
      break;
    case WebpackConfigTarget.NODE:
      Config = NodeWebpackConfig;
      break;
    default:
      Config = null;
  }

  if (!Config) {
    return null;
  }

  const config = new Config(appContext, resolvedConfig);

  return config.config();
};

export {
  ClientWebpackConfig,
  ModernWebpackConfig,
  NodeWebpackConfig,
} from './config';
