// eslint-disable-next-line import/no-useless-path-segments
import { isFunction, logger, isPlainObject } from './index';

export function applyOptionsChain<T, U>(
  defaults: T,
  options?:
    | T
    | ((config: T, utils?: U) => T | void)
    | Array<T | ((config: T, utils?: U) => T | void)>,
  utils?: U,
  mergeFn?: typeof Object.assign,
): T;
export function applyOptionsChain<T, U>(
  defaults: T,
  options:
    | T
    | ((config: T, utils: U) => T | void)
    | Array<T | ((config: T, utils: U) => T | void)>,
  utils: U,
  mergeFn?: typeof Object.assign,
): T;
export function applyOptionsChain<T>(
  defaults: T,
  options?: unknown,
  utils?: unknown,
  mergeFn = Object.assign,
) {
  if (!options) {
    return defaults;
  }

  if (isPlainObject(options) as any) {
    return mergeFn(defaults, options);
  } else if (isFunction(options)) {
    const ret = options(defaults, utils);
    if (ret) {
      if (!isPlainObject(ret)) {
        logger.warn(
          `${options.name}: Function should mutate the config and return nothing, Or return a cloned or merged version of config object.`,
        );
      }
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce(
      (memo, cur) => applyOptionsChain(memo, cur, utils, mergeFn),
      defaults,
    );
  } else {
    throw new Error(
      `applyOptionsChain error:\ndefault options is: ${JSON.stringify(
        defaults,
      )}`,
    );
  }
  return defaults;
}
