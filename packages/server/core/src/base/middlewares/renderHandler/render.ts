import type { ServerRoute } from '@modern-js/types';
import { Render } from '../../../core/render';
import {
  createErrorHtml,
  sortRoutes,
  cutNameByHyphen,
  parseQuery,
} from '../../utils';
import { dataHandler } from './dataHandler';
import { ssrRender } from './ssrRender';

interface CreateRenderOptions {
  routes: ServerRoute[];
  pwd: string;
  staticGenerate?: boolean;
  metaName?: string;
  forceCSR?: boolean;
  nonce?: string;
}

export async function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  forceCSR,
  nonce,
}: CreateRenderOptions): Promise<Render> {
  return async (req, { logger, nodeReq, reporter, tpls, serverManifest }) => {
    const routeInfo = matchRoute(req, routes);

    if (!routeInfo) {
      return new Response(createErrorHtml(404), {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
      });
    }

    const html = tpls[routeInfo.entryName!];

    if (!html) {
      throw new Error(`Can't found entry ${routeInfo.entryName!} html `);
    }

    const renderMode = getRenderMode(
      req,
      metaName || 'modern-js',
      routeInfo.isSSR,
      forceCSR,
    );

    const renderOptions = {
      pwd,
      mode: 'string',
      html,
      routeInfo,
      staticGenerate: staticGenerate || false,
      metaName: metaName || 'modern-js',
      nonce,
      logger,
      nodeReq,
      reporter,
      serverRoutes: routes,
      serverManifest,
    };

    switch (renderMode) {
      case 'data':
        // eslint-disable-next-line no-case-declarations
        let response = await dataHandler(req, renderOptions);
        if (!response) {
          response = await ssrRender(req, renderOptions);
        }

        return response;
      case 'ssr':
        return ssrRender(req, renderOptions);
      case 'csr':
        return csrRender(html);
      default:
        throw new Error(`Unknown render mode: ${renderMode}`);
    }
  };
}

function matchRoute(
  req: Request,
  routes: ServerRoute[],
): ServerRoute | undefined {
  const sorted = routes.sort(sortRoutes);
  for (const route of sorted) {
    const reg = new RegExp(route.urlPath);

    if (reg.test(req.url)) {
      return route;
    }
  }

  return undefined;
}

function getRenderMode(
  req: Request,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
): 'ssr' | 'csr' | 'data' {
  const query = parseQuery(req);

  if (isSSR) {
    if (query.__loader) {
      return 'data';
    }
    if (
      forceCSR &&
      (query.csr ||
        req.headers.get(`x-${cutNameByHyphen(framework)}-ssr-fallback`))
    ) {
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}

function csrRender(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: new Headers({
      'content-type': 'text/html; charset=UTF-8',
    }),
  });
}
