import assert from 'assert';
import path from 'path';
import { pathToFileURL } from 'url';
import type {
  Compiler as WebpackCompiler,
  MultiCompiler as WebpackMultiCompiler,
} from 'webpack';
import type {
  Compiler as RspackCompiler,
  MultiCompiler as RspackMultiCompiler,
} from '@rspack/core';

const GLOBAL_PATCHED_SYMBOL: unique symbol = Symbol('GLOBAL_PATCHED_SYMBOL');

declare global {
  interface Location {
    [GLOBAL_PATCHED_SYMBOL]?: true;
  }
}

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
export function patchGlobalLocation() {
  const href = pathToFileURL(process.cwd()).href + path.sep;
  const location = Object.freeze({ [GLOBAL_PATCHED_SYMBOL]: true, href });
  global.location ||= location as unknown as Location;
  assert(typeof global.location.href === 'string');
}

export function unpatchGlobalLocation() {
  if (global.location?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location;
  }
}

export function patchCompilerGlobalLocation(
  compiler:
    | WebpackCompiler
    | RspackCompiler
    | WebpackMultiCompiler
    | RspackMultiCompiler,
) {
  // https://github.com/webpack/webpack/blob/136b723023f8f26d71eabdd16badf04c1c8554e4/lib/MultiCompiler.js#L64
  compiler.hooks.run.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchRun.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchClose.tap('PatchGlobalLocation', unpatchGlobalLocation);
  compiler.hooks.done.tap('PatchGlobalLocation', unpatchGlobalLocation);
}
