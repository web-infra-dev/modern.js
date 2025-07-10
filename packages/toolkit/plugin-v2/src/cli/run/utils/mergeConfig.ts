import { isOverriddenConfigKey } from '@modern-js/utils';
import {
  isArray,
  isEqual,
  isFunction,
  mergeWith,
  unionWith,
} from '@modern-js/utils/lodash';
import type { DeepPartial } from '../../../types/utils';

export const mergeConfig = <Config, NormalizedConfig>(
  configs: Array<DeepPartial<Config>>,
): NormalizedConfig =>
  mergeWith({}, ...configs, (target: any, source: any, key: string) => {
    // Do not use the following merge logic for some keys
    if (
      key === 'designSystem' ||
      (key === 'tailwindcss' && typeof source === 'object')
    ) {
      return mergeWith({}, target ?? {}, source ?? {});
    }

    // Some keys should use source to override target
    if (isOverriddenConfigKey(key)) {
      return source ?? target;
    }

    if (isArray(source)) {
      // 如果 target 不是数组 (可能是 undefined 或被之前的配置清空为 false)，
      // 则直接使用 source 作为新起点。
      const targetArray = isArray(target) ? target : [];

      // 使用 unionWith 进行去重合并
      return unionWith(targetArray, source, isEqual);
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
