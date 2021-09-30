import { IncomingMessage, ServerResponse } from 'http';
import { Measure, Logger } from '../../type';
import { ModernServerContext } from './context';

export const createContext = (
  req: IncomingMessage,
  res: ServerResponse,
  { logger, measure }: { logger: Logger; measure: Measure },
) => new ModernServerContext(req, res, { logger, measure });

export { ModernServerContext };
