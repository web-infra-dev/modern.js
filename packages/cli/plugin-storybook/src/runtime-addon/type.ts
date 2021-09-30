import type { NormalizedConfig } from '@modern-js/core';

export interface IConfig {
  modernConfigRuntime: NormalizedConfig['runtime'];
  modernConfigDesignToken: any;
}
