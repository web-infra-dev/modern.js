import type * as Rspack from '@rspack/core';

type Compiler = Rspack.Compiler;
type RspackOptions = Rspack.RspackOptions;
type MultiCompiler = Rspack.MultiCompiler;

export type { Compiler, MultiCompiler, Rspack };

export type RspackBuiltinsConfig = Omit<
  NonNullable<RspackOptions['builtins']>,
  'html'
>;

export interface RspackConfig extends RspackOptions {
  /** multi type is useless in builder and make get value difficult */
  entry?: Record<string, string | string[]>;
  // can't use htmlPlugin & builtins.html at the same time.
  builtins?: RspackBuiltinsConfig;
  /** rspack-dev-server is not used in modern.js */
  devServer?: {
    hot?: boolean;
  };
}

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type RspackRule = GetElementType<
  NonNullable<NonNullable<RspackConfig['module']>['rules']>
>;

export type RuleSetRule = Rspack.RuleSetRule;

export type RspackPluginInstance = GetElementType<
  NonNullable<RspackConfig['plugins']>
>;
