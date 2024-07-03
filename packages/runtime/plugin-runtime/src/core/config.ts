import type React from 'react';
import { AppConfig, RuntimeConfig } from '../common';

const APP_CONFIG_SYMBOL = 'config';
export const getConfig = (
  Component: React.ComponentType<any>,
): AppConfig | undefined =>
  // @ts-expect-error
  Component[APP_CONFIG_SYMBOL];

/**
 * @deprecated
 * define config in modern.runtime.ts file
 */
export const defineConfig = (
  Component: React.ComponentType<any>,
  config: AppConfig,
): React.ComponentType<any> => {
  // @ts-expect-error
  Component[APP_CONFIG_SYMBOL] = config;
  return Component;
};

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineRuntimeConfig = (config: RuntimeConfig) => config;
