import _ from '@modern-js/utils/lodash';

export const defaultsToBuilderConfig = <T>(...configs: T[]): T =>
  _.mergeWith({}, ...configs, (target: unknown, source: unknown) => {
    const pair = [target, source];

    // Use the defined one.
    if (pair.some(_.isUndefined)) {
      return target ?? source;
    }

    // Handle on each properties.
    if (_.every(pair, _.isPlainObject)) {
      return undefined;
    }

    return target;
  });

export const mergeBuilderConfig = <T>(...configs: T[]): T =>
  _.mergeWith({}, ...configs, (target: unknown, source: unknown) => {
    const pair = [target, source];
    if (pair.some(_.isUndefined)) {
      // fallback to lodash default merge behavior
      return undefined;
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
  });
