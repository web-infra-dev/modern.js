import { IncomingMessage } from 'node:http';
import { Logger, Reporter } from '@modern-js/types';

export interface RenderOptions {
  logger: Logger;
  reporter?: Reporter;
  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
