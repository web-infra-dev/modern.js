import type { Compiler, RspackOptions, MultiCompiler } from '@rspack/core';

export { Compiler, MultiCompiler };

export type RspackBuiltinsConfig = Omit<
  NonNullable<RspackOptions['builtins']>,
  'html'
>;

export interface RspackConfig extends RspackOptions {
  /** multi type is useless in builder and make get value difficult */
  entry?: Record<string, string | string[]>;
  // can't use htmlPlugin & builtins.html at the same time.
  builtins?: RspackBuiltinsConfig;
}

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type RspackRuleSet = GetElementType<
  NonNullable<NonNullable<RspackConfig['module']>['rules']>
>;

export type RspackPluginInstance = GetElementType<
  NonNullable<RspackConfig['plugins']>
>;
