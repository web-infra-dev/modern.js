import { ensureArray, isOverriddenConfigKey } from '@modern-js/utils';
import { isEqual, isFunction, mergeWith } from '@modern-js/utils/lodash';
import type { DeepPartial } from '../../../types/utils';

export const mergeConfig = <Config, NormalizedConfig>(
  configs: Array<DeepPartial<Config>>,
): NormalizedConfig =>
  mergeWith({}, ...configs, (target: any, source: any, key: string) => {
    // Some keys should use source to override target
    if (isOverriddenConfigKey(key)) {
      return source ?? target;
    }

    if (Array.isArray(target) || Array.isArray(source)) {
      if (target === undefined) {
        return source;
      }
      if (source === undefined) {
        return target;
      }
      const targetArray = ensureArray(target);
      const sourceArray = ensureArray(source);
      const allItems = [...targetArray, ...sourceArray];
      const seenNonFunc: any[] = [];
      const result: any[] = [];
      for (const item of allItems) {
        if (isFunction(item)) {
          result.push(item);
        } else {
          if (!seenNonFunc.some(seen => isEqual(seen, item))) {
            seenNonFunc.push(item);
            result.push(item);
          }
        }
      }
      return result;
    }

    if (isFunction(target) || isFunction(source)) {
      if (source === undefined) {
        return target;
      }
      if (target === undefined) {
        return source;
      }
      return [target, source];
    }

    return undefined;
  });
