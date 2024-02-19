import { IncomingMessage } from 'node:http';
import { Logger } from '@modern-js/types';

export interface RenderOptions {
  logger: Logger;
  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
