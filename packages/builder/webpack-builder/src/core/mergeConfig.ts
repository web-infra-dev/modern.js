import { isFunction, mergeWith } from '@modern-js/utils/lodash';
import type { BuilderConfig } from '../types';

export const mergeBuilderConfig = (configs: BuilderConfig[]): BuilderConfig =>
  mergeWith({}, ...configs, (target: unknown, source: unknown) => {
    if (source === undefined) {
      return target;
    }
    if (target === undefined) {
      return source;
    }

    const isTargetArr = Array.isArray(target);
    const isSourceArr = Array.isArray(source);

    if (isTargetArr && isSourceArr) {
      return [...target, ...source];
    }

    if (isSourceArr || isTargetArr) {
      return isTargetArr
        ? [...target, source]
        : [target, ...(source as unknown[])];
    }

    // convert function to chained function
    if (isFunction(target) || isFunction(source)) {
      return [target, source];
    }

    // fallback to lodash default merge behavior
    return undefined;
  });
