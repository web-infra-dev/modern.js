import type { STATUS } from '../shared';
import type { Hooks } from '../core/createHook';
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
  hooks: Hooks;
  status: STATUS;
  config: WebBuilderConfig;
  setStatus: (status: STATUS) => void;
};
