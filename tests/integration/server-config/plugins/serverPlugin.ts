import * as path from 'path';
import type { MiddlewareHandler, ServerPlugin } from '@modern-js/server-core';
import { requireExistModule } from '@modern-js/utils';

export const isDev = (): boolean => process.env.NODE_ENV === 'development';

export const isProd = (): boolean => process.env.NODE_ENV === 'production';

export const isTest = () => process.env.NODE_ENV === 'test';

export const API_DIR = 'api';

export const SERVER_DIR = 'server';

export const SHARED_DIR = 'shared';

export const API_APP_NAME = '_app';

export default (): ServerPlugin => ({
  name: 'serverPlugin1',
  setup: api => {
    api.onPrepare(async () => {
      const { appDirectory, distDirectory } = api.getServerContext();

      const root = isProd() ? distDirectory : appDirectory;

      const apiPath = path.resolve(root || process.cwd(), API_DIR);
      const apiAppPath = path.resolve(apiPath, API_APP_NAME);
      await requireExistModule(apiAppPath);
    });
    api.prepareApiServer(() => {
      return (async (c: any) => {
        const pathname = c.req.path;
        if (pathname === '/api/foo') {
          return c.text('foo');
        } else {
          return c.text('Hello Modernjs');
        }
      }) as unknown as Promise<MiddlewareHandler>;
    });
  },
});
