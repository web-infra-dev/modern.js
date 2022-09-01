// eslint-disable-next-line import/no-useless-path-segments
import { isFunction, logger, isPlainObject } from './index';

export type OptionsChainFunction<T, U> = (config: T, utils?: U) => T | void;

export function applyOptionsChain<T, U>(
  defaults: T,
  options?:
    | T
    | OptionsChainFunction<T, U>
    | Array<T | OptionsChainFunction<T, U>>,
  utils?: U,
  mergeFn = Object.assign,
): T {
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
      (memo: T, cur) => applyOptionsChain<T, U>(memo, cur, utils, mergeFn),
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
