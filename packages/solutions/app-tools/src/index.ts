import { appTools } from './new/index';

export { appTools, type AppToolsPlugin } from './new/index';
export { dev } from './commands/dev';
export type { DevOptions } from './utils/types';

export { mergeConfig } from '@modern-js/core';
export { defineConfig, defineLegacyConfig } from './defineConfig';
export * from './types';

export type { RuntimeUserConfig } from './types/config';

export default appTools;
