import _ from '@modern-js/utils/lodash';

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

      // always use source override target, if target defined.
      if (['removeConsole'].includes(key)) {
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
