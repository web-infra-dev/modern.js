import type { AppNormalizedConfig } from '@modern-js/app-tools';

// support legacy config
export function getRuntimeConfig(config: Partial<AppNormalizedConfig>) {
  if (config?.runtime?.features) {
    return config?.runtime?.features;
  }
  return config?.runtime || {};
}

// support legacy config
export function setRuntimeConfig(
  config: Partial<AppNormalizedConfig>,
  key: string,
  value: any,
): undefined {
  if (config?.runtime?.features && config?.runtime?.features[key]) {
    config.runtime.features[key] = value;
    return undefined;
  }
  if (config?.runtime && config?.runtime[key]) {
    config.runtime[key] = value;
    return undefined;
  }
  return undefined;
}
