import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import type {
  AppNormalizedConfig,
  AppToolsContext,
} from '@modern-js/app-tools';
import {
  type ProdServerOptions,
  createProdServer,
  loadServerPlugins,
} from '@modern-js/prod-server';
import type {
  ServerRoute as ModernRoute,
  ServerPlugin,
} from '@modern-js/types';
import { SERVER_DIR, createLogger, getMeta, logger } from '@modern-js/utils';
import { chunkArray, openRouteSSR } from '../libs/util';
import type { SsgRoute } from '../types';

// SSG only interrupt when stderror, so we need to override the rslog's error to console.error
function getLogger() {
  const l = createLogger({
    level: 'verbose',
  });
  return {
    ...l,
    error: (...args: any[]) => {
      console.error(...args);
    },
  };
}

const MAX_CONCURRENT_REQUESTS = 10;

function createMockIncomingMessage(
  url: string,
  headers: Record<string, string> = {},
): IncomingMessage {
  const urlObj = new URL(url);
  const mockReq = new IncomingMessage({} as any);

  // Set basic properties that createWebRequest uses
  mockReq.url = urlObj.pathname + urlObj.search;
  mockReq.method = 'GET';
  mockReq.headers = {
    host: urlObj.host,
    'user-agent': 'SSG-Renderer/1.0',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.5',
    'accept-encoding': 'gzip, deflate',
    connection: 'keep-alive',
    ...headers,
  };

  // Set other required properties for IncomingMessage
  mockReq.httpVersion = '1.1';
  mockReq.httpVersionMajor = 1;
  mockReq.httpVersionMinor = 1;
  mockReq.complete = true;
  mockReq.rawHeaders = [];
  mockReq.socket = {} as any;
  mockReq.connection = mockReq.socket;

  return mockReq;
}

function createMockServerResponse(): ServerResponse {
  const mockRes = new ServerResponse({} as any);
  return mockRes;
}

export const createServer = async (
  appContext: AppToolsContext,
  ssgRoutes: SsgRoute[],
  pageRoutes: ModernRoute[],
  apiRoutes: ModernRoute[],
  options: AppNormalizedConfig,
): Promise<string[]> => {
  // this side of the shallow copy of a route for subsequent render processing, to prevent the modification of the current field
  // manually enable the server-side rendering configuration for all routes that require SSG
  const entries = ssgRoutes.map(route => route.entryName!);
  const backup: ModernRoute[] = openRouteSSR(pageRoutes, entries);
  const total = backup.concat(apiRoutes);
  try {
    const meta = getMeta(appContext.metaName);

    const distDirectory = appContext.distDirectory;
    const serverConfigPath = path.resolve(
      distDirectory,
      SERVER_DIR,
      `${meta}.server`,
    );

    const plugins: ServerPlugin[] = appContext.serverPlugins;

    const serverOptions: ProdServerOptions = {
      pwd: distDirectory,
      config: options as any,
      appContext,
      serverConfigPath,
      routes: total,
      plugins: await loadServerPlugins(
        plugins,
        appContext.appDirectory || distDirectory,
      ),
      staticGenerate: true,
      logger: getLogger(),
    };

    const nodeServer = await createProdServer(serverOptions);
    const requestHandler = nodeServer.getRequestHandler();

    const chunkedRoutes = chunkArray(ssgRoutes, MAX_CONCURRENT_REQUESTS);
    const results: string[] = [];

    for (const routes of chunkedRoutes) {
      const promises = routes.map(async route => {
        const url = `http://localhost${route.urlPath}`;
        const request = new Request(url, {
          method: 'GET',
          headers: {
            host: 'localhost',
            'x-modern-ssg-render': 'true',
          },
        });

        const mockReq = createMockIncomingMessage(url);
        const mockRes = createMockServerResponse();

        const response = await requestHandler(request, {
          // It is mainly for the enableHandleWeb scenario; the req is useless for other scenarios.
          node: {
            req: mockReq,
            res: mockRes,
          },
        });

        return await response.text();
      });

      const batch = await Promise.all(promises);
      results.push(...batch);
    }

    return results;
  } catch (e) {
    logger.error(e instanceof Error ? e.stack : (e as any).toString());
    throw new Error('ssg render failed');
  }
};
