import { defineConfig as _defineConfig } from '@modern-js/core';
import type { Config } from '../types/config';

export const defineConfig = (config: Config): Config =>
  _defineConfig(config as any) as Config;
