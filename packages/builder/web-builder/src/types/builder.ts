import type { WebBuilderConfig } from './config';

export type WebBuilderTarget = 'web' | 'node' | 'modern-web';

export type WebBuilderOptions = {
  cwd?: string;
  target?: WebBuilderTarget | WebBuilderTarget[];
  configPath?: string | null;
  builderConfig?: WebBuilderConfig;
};
