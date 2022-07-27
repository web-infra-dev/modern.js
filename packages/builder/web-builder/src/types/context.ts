import type { WebBuilderConfig } from './config';
import type { WebpackChain } from './dependencies';

// The public context
export type WebBuilderContext = {
  srcPath: string;
  distPath: string;
  cachePath: string;
  originalConfig: WebBuilderConfig;
};

// The private context
export type Context = WebBuilderContext & {
  chain: WebpackChain;
};
