import { IncomingMessage, ServerResponse } from 'http';
import { ModernServerContext } from './context';

export const createContext = (req: IncomingMessage, res: ServerResponse) =>
  new ModernServerContext(req, res);

export { ModernServerContext };
