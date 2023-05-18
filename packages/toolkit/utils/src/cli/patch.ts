/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import path from 'path';
import { pathToFileURL } from 'url';

const GLOBAL_PATCHED_SYMBOL = Symbol('GLOBAL_PATCHED_SYMBOL');

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
export function patchGlobalLocation() {
  const href = `${pathToFileURL(process.cwd()).href}${path.sep}`;
  // @ts-expect-error
  href[GLOBAL_PATCHED_SYMBOL] = true;
  // @ts-expect-error
  global.location ||= Object.freeze({ [GLOBAL_PATCHED_SYMBOL]: true });
  global.location.href ||= href;
}

export function unpatchGlobalLocation() {
  // @ts-expect-error
  if (global.location?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location;
    // @ts-expect-error
  } else if (global.location?.href?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location.href;
  }
}
