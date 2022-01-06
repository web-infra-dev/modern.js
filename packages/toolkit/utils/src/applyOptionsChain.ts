// eslint-disable-next-line import/no-useless-path-segments
import { isFunction, logger, isPlainObject } from './index';

export const applyOptionsChain = <T, U>(
  defaults: T,
  /* eslint-disable @typescript-eslint/no-invalid-void-type */
  options?:
    | T
    | ((config: T, utils?: U) => T | void)
    | Array<T | ((config: T, utils?: U) => T | void)>,
  /* eslint-enable @typescript-eslint/no-invalid-void-type */
  utils?: U,
  mergeFn = Object.assign,
): T => {
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
    return options.reduce<T>(
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
};
