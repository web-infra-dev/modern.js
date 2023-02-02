import type { ConfigParams } from '@modern-js/core';
import type { Config } from '@modern-js/doc-core';

export const defineConfig = (
  config: Config | ((params: ConfigParams) => Promise<Config> | Config),
) => config;
