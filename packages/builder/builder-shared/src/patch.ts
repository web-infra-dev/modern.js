import assert from 'assert';
import path from 'path';
import { pathToFileURL } from 'url';

const GLOBAL_PATCHED_SYMBOL = Symbol('GLOBAL_PATCHED_SYMBOL');

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
export function patchGlobalLocation() {
  const href = `${pathToFileURL(process.cwd()).href}${path.sep}`;
  // @ts-expect-error
  global.location ||= Object.freeze({ [GLOBAL_PATCHED_SYMBOL]: true, href });
  assert(typeof global.location.href === 'string');
}

export function unpatchGlobalLocation() {
  // @ts-expect-error
  if (global.location?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location;
  }
}
