import { TransformOptions } from 'esbuild';

export interface IConfigLoaderOptions {
  cwd: string;
  configKey: string;
  configFile: string;
  configSuffix?: string;
  transformOptions?: TransformOptions;
}

export interface IConfigLoaderMessage {
  message: string;
  location?: {
    file: string;
    source: string;
    /**
     * Error starting line, initially 1
     */
    line?: number;
    /**
     * Error starting column, initially 1
     */
    column?: number;
    length?: number;
  };
}

export interface IConfigLoaderResult<T> {
  path?: string;
  data: T;
  errors?: IConfigLoaderMessage[];
  warnings?: IConfigLoaderMessage[];
}
