import type { STATUS } from '../shared';
import type { WebBuilderConfig } from './config';

// The public context
export type WebBuilderContext = {
  srcPath: string;
  distPath: string;
  cachePath: string;
  originalConfig: WebBuilderConfig;
};

// The private context
export type Context = WebBuilderContext & {
  status: STATUS;
  config: WebBuilderConfig;
  setStatus: (status: STATUS) => void;
};
