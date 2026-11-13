import { createBffHandlers } from '@modern-js/mcp-apps/server';
import createServer from '../server/mcp';
export const { POST, GET, DELETE } = createBffHandlers(request =>
  createServer({ request }),
);
