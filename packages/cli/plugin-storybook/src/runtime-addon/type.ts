import type { NormalizedConfig } from '@modern-js/module-tools-v2';

export interface IConfig {
  modernConfigRuntime: NormalizedConfig['runtime'];
  modernConfigDesignToken: any;
}
