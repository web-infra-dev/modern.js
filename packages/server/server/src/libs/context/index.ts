import { IncomingMessage, ServerResponse } from 'http';
import { Metrics, Logger } from '../../type';
import { ModernServerContext } from './context';

export const createContext = (
  req: IncomingMessage,
  res: ServerResponse,
  { logger, metrics }: { logger: Logger; metrics: Metrics },
) => new ModernServerContext(req, res, { logger, metrics });

export { ModernServerContext };
