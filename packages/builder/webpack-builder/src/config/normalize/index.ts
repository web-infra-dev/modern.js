import _ from '@modern-js/utils/lodash';
import type { BuilderConfig, FinalBuilderConfig } from '../../types';

export const mergeConfig = <T>(...configs: T[]): T =>
  _.mergeWith({}, ...configs, (target: unknown, source: unknown) => {
    const pair = [target, source];
    if (pair.some(_.isUndefined)) {
      return pair.find(_.negate(_.isUndefined));
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

export const normalizeFinalBuilderConfig = (
  dest: FinalBuilderConfig,
  ...sources: BuilderConfig[]
): FinalBuilderConfig =>
  mergeConfig<FinalBuilderConfig>(dest, ...(sources as FinalBuilderConfig[]));

export const createDefaultFinalBuilderConfig = (): FinalBuilderConfig =>
  ({
    // TODO: impl
  } as any);
