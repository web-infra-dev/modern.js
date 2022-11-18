import { mergeWith, isFunction } from '@modern-js/utils/lodash';
import { CliUserConfig, CliNormalizedConfig } from '../types';

export const mergeConfig = <ExtendConfig extends Record<string, any>>(
  configs: Array<
    CliUserConfig<ExtendConfig> | CliNormalizedConfig<ExtendConfig>
  >,
): CliNormalizedConfig<ExtendConfig> =>
  mergeWith({}, ...configs, (target: any, source: any, key: string) => {
    // Do not use the following merge logic for source.designSystem and tools.tailwind(css)
    if (
      key === 'designSystem' ||
      (key === 'tailwind' && typeof source === 'object') ||
      (key === 'tailwindcss' && typeof source === 'object') ||
      key === 'devServer'
    ) {
      return mergeWith({}, target ?? {}, source ?? {});
    }

    if (Array.isArray(target)) {
      if (Array.isArray(source)) {
        return [...target, ...source];
      } else {
        return source !== undefined ? [...target, source] : target;
      }
    } else if (isFunction(target) || isFunction(source)) {
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
