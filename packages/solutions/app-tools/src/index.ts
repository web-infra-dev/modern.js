import { appTools } from './new/index';

export { appTools };

// new app tools plugin
export { initAppContext } from './new/index';

export { defineConfig, defineLegacyConfig } from './defineConfig';
export { mergeConfig } from '@modern-js/core';
export type { RuntimeUserConfig } from './types/config';

export { dev } from './commands/dev';
export type { DevOptions } from './utils/types';
export { generateWatchFiles } from './utils/generateWatchFiles';

export * from './types';

export default appTools;
