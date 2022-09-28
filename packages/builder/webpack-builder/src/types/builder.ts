import type * as webpack from 'webpack';
import type { BuilderConfig } from './config';
import type { Context } from './context';
import type { PromiseOrNot } from './utils';

export type BuilderTarget = 'web' | 'node' | 'modern-web';

export type BuilderMode = 'development' | 'production';

export type BuilderOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** The entry points object. */
  entry?: webpack.EntryObject;
  /** Type of build target. */
  target?: BuilderTarget | BuilderTarget[];
  /** Framework name, such as 'modern.js' */
  framework?: string;
  /** Absolute path of framework config file. */
  configPath?: string | null;
  /** Builder config object. */
  builderConfig?: BuilderConfig;
  /** Toggle whether to validate the config. */
  validate?: boolean;
};

export type InspectOptions = {
  env?: BuilderMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type ExecuteBuild = (
  context: Context,
  configs: webpack.Configuration[],
) => PromiseOrNot<{ stats: webpack.MultiStats } | void>;
