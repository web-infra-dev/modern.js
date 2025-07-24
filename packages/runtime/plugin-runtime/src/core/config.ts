import type React from 'react';
import type { AppConfig, RuntimeConfig } from '../common';

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineRuntimeConfig = (
  config: RuntimeConfig | ((entryName: string) => RuntimeConfig),
) => config;
