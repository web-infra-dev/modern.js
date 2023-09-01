import _ from '@modern-js/utils/lodash';
import { isOverriddenConfigKey } from '@modern-js/utils';

export const mergeBuilderConfig = <T>(...configs: T[]): T =>
  _.mergeWith(
    {},
    ...configs,
    (target: unknown, source: unknown, key: string) => {
      const pair = [target, source];
      if (pair.some(_.isUndefined)) {
        // fallback to lodash default merge behavior
        return undefined;
      }

      // Some keys should use source to override target
      if (isOverriddenConfigKey(key)) {
        return source ?? target;
      }

      if (pair.some(_.isArray)) {
        return [..._.castArray(target), ..._.castArray(source)];
      }
      // convert function to chained function
      if (pair.some(_.isFunction)) {
        return [target, source];
      }
      // fallback to lodash default merge behavior
      return undefined;
    },
  );
