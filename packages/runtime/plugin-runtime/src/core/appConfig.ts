import type React from 'react';
import { AppConfig } from '../common';

const APP_CONFIG_SYMBOL = 'config';
export const getConfig = (
  Component: React.ComponentType<any>,
): AppConfig | undefined =>
  // @ts-expect-error
  Component[APP_CONFIG_SYMBOL];

export const defineConfig = (
  Component: React.ComponentType<any>,
  config: AppConfig,
): React.ComponentType<any> => {
  // @ts-expect-error
  Component[APP_CONFIG_SYMBOL] = config;
  return Component;
};
