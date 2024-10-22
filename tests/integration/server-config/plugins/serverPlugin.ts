import * as path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';
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
    return {
      async prepare() {
        const { appDirectory, distDirectory } = api.useAppContext();

        const root = isProd() ? distDirectory : appDirectory;

        const apiPath = path.resolve(root || process.cwd(), API_DIR);
        const apiAppPath = path.resolve(apiPath, API_APP_NAME);
        await requireExistModule(apiAppPath);
      },
      config(serverConfig) {
        if (serverConfig.bff?.proxy) {
          serverConfig.bff.proxy['/api/bar'] = {
            target: `http://127.0.0.1:${process.env.PORT}`,
            pathRewrite: { '/api/bar': '/api/foo' },
            changeOrigin: true,
          };
        }
        return serverConfig;
      },

      async prepareApiServer() {
        return async c => {
          const pathname = c.req.path;
          if (pathname === '/api/foo') {
            return c.text('foo');
          } else {
            return c.text('Hello Modernjs');
          }
        };
      },
    };
  },
});
