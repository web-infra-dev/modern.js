import type { BuilderConfig } from './config';

export type BuilderTarget = 'web' | 'node' | 'modern-web';

export type BuilderOptions = {
  cwd?: string;
  target?: BuilderTarget | BuilderTarget[];
  configPath?: string | null;
  builderConfig?: BuilderConfig;
  framework?: string;
};
