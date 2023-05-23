import path from 'path';
import { pathToFileURL } from 'url';
import { CompilerTapFn } from './types';

const GLOBAL_PATCHED_SYMBOL: unique symbol = Symbol('GLOBAL_PATCHED_SYMBOL');

declare global {
  interface Location {
    [GLOBAL_PATCHED_SYMBOL]?: true;
  }
}

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
export function patchGlobalLocation() {
  if (!global.location) {
    const href = pathToFileURL(process.cwd()).href + path.sep;
    const location = Object.freeze({ [GLOBAL_PATCHED_SYMBOL]: true, href });
    global.location = location as unknown as Location;
  }
}

export function unpatchGlobalLocation() {
  if (global.location?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location;
  }
}

export function patchCompilerGlobalLocation(compiler: {
  hooks: {
    run: CompilerTapFn;
    watchRun: CompilerTapFn;
    watchClose: CompilerTapFn;
    done: CompilerTapFn;
  };
}) {
  // https://github.com/webpack/webpack/blob/136b723023f8f26d71eabdd16badf04c1c8554e4/lib/MultiCompiler.js#L64
  compiler.hooks.run.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchRun.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchClose.tap('PatchGlobalLocation', unpatchGlobalLocation);
  compiler.hooks.done.tap('PatchGlobalLocation', unpatchGlobalLocation);
}
