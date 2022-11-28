import type { Compiler, RspackOptions } from '@rspack/core';

export { Compiler };

export interface RspackConfig extends RspackOptions {
  /** multi type is useless in builder and make get value difficult */
  entry?: Record<string, string | string[]>;
}
