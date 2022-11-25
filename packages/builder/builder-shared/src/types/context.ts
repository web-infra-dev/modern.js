import type { BuilderEntry, BuilderTarget } from './builder';

/** The public context */
export type BuilderContext = {
  /** The entry points object. */
  entry: BuilderEntry;
  /** The build target type. */
  target: BuilderTarget | BuilderTarget[];
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
  /** Info of dev server  */
  devServer?: {
    hostname: string;
    port: number;
  };
};
