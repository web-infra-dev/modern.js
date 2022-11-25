import { IncomingMessage, ServerResponse } from 'http';
import { ModernServerContext, ContextOptions } from './context';

export const createContext = (
  req: IncomingMessage,
  res: ServerResponse,
  options?: ContextOptions,
) => new ModernServerContext(req, res, options);

export { ModernServerContext };
export type { ContextOptions };
