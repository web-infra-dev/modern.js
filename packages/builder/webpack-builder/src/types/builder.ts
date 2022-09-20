import type { BuilderConfig } from './config';

export type BuilderTarget = 'web' | 'node' | 'modern-web';

export type BuilderEntry = Record<string, string | string[]>;

export type BuilderOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** The entry points object. */
  entry?: BuilderEntry;
  /** Type of build target. */
  target?: BuilderTarget | BuilderTarget[];
  /** Framework name, such as 'modern.js' */
  framework?: string;
  /** Absolute path of framework config file. */
  configPath?: string | null;
  /** Builder config object. */
  builderConfig?: BuilderConfig;
};

export type InspectOptions = {
  env?: 'development' | 'production';
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};
