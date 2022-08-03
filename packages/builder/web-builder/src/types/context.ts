import type { STATUS } from '../shared';
import type { Hooks } from '../core/createHook';
import type { WebBuilderConfig } from './config';

/** The public context */
export type WebBuilderContext = {
  /** The root path of current project. */
  rootPath: string;
  /** Absolute path of source files. */
  srcPath: string;
  /** Absolute path of output files. */
  distPath: string;
  /** Absolute path of cache files. */
  cachePath: string;
  /** Absolute path of framework config file. */
  configPath?: string;
  /** Absolute path of tsconfig.json. */
  tsconfigPath?: string;
  /** The original builder config passed from the createBuilder method. */
  originalConfig: Readonly<WebBuilderConfig>;
};

// The private context
export type Context = WebBuilderContext & {
  status: STATUS;
  hooks: Readonly<Hooks>;
  config: Readonly<WebBuilderConfig>;
};
