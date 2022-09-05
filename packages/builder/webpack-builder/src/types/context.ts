import type { EntryObject } from 'webpack';
import type { Hooks } from '../core/createHook';
import type { BuilderConfig } from './config';

/** The public context */
export type BuilderContext = {
  /** The entry points object. */
  entry: EntryObject;
  /** The root path of current project. */
  rootPath: string;
  /** Absolute path of source files. */
  srcPath: string;
  /** Absolute path of output files. */
  distPath: string;
  /** The name of framework, such as `modern-js`. */
  framework: string;
  /** Absolute path of cache files. */
  cachePath: string;
  /** Absolute path of framework config file. */
  configPath?: string;
  /** Absolute path of tsconfig.json. */
  tsconfigPath?: string;
  /** The original builder config passed from the createBuilder method. */
  originalConfig: Readonly<BuilderConfig>;
  /** Info of dev server  */
  devServer?: {
    ip: string;
    port: number;
  };
};

/** The inner context */
export type Context = BuilderContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current builder config. */
  config: Readonly<BuilderConfig>;
  /** The async task to validate schema of config. */
  configValidatingTask: Promise<void>;
};
