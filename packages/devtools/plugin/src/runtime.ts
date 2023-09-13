import type { SetupClientOptions } from '@modern-js/devtools-kit';
import { mountDevTools } from '@modern-js/devtools-mount';

const opts = process.env.__MODERN_DEVTOOLS_MOUNT_OPTIONS;

mountDevTools(opts as unknown as SetupClientOptions);
