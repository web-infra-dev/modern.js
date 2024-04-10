import type { IncomingMessage } from 'http';
import { ServerRoute } from '@modern-js/types';
import { cutNameByHyphen } from '@modern-js/utils/universal';
import { REPLACE_REG } from '../../../base/constants';
import { Render } from '../../../core/render';
import {
  createErrorHtml,
  sortRoutes,
  parseQuery,
  transformResponse,
  getPathname,
} from '../../utils';
import { dataHandler } from './dataHandler';
import { SSRRenderOptions, ssrRender } from './ssrRender';

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
  return async (
    req,
    { logger, nodeReq, reporter, templates, serverManifest, locals },
  ) => {
    const routeInfo = matchRoute(req, routes);

    if (!routeInfo) {
      return new Response(createErrorHtml(404), {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
      });
    }

    const html = templates[routeInfo.entryName!];

    // TODO: maybe it should be 404 and warning
    if (!html) {
      throw new Error(`Can't found entry ${routeInfo.entryName!} html `);
    }

    const renderMode = getRenderMode(
      req,
      metaName || 'modern-js',
      routeInfo.isSSR,
      forceCSR,
      nodeReq,
    );

    const renderOptions = {
      pwd,
      html,
      routeInfo,
      staticGenerate: staticGenerate || false,
      metaName: metaName || 'modern-js',
      nonce,
      logger,
      nodeReq,
      reporter,
      serverRoutes: routes,
      locals,
      serverManifest,
    };

    switch (renderMode) {
      case 'data':
        // eslint-disable-next-line no-case-declarations
        let response = await dataHandler(req, renderOptions);
        if (!response) {
          response = await renderHandler(req, renderOptions, 'ssr');
        }

        return response;
      case 'ssr':
      case 'csr':
        return renderHandler(req, renderOptions, renderMode);
      default:
        throw new Error(`Unknown render mode: ${renderMode}`);
    }
  };
}

async function renderHandler(
  request: Request,
  options: SSRRenderOptions,
  mode: 'ssr' | 'csr',
) {
  // inject server.baseUrl message
  const serverData = {
    router: {
      baseUrl: options.routeInfo.urlPath,
      params: {} as Record<string, any>,
    },
  };

  const response = await (mode === 'ssr'
    ? ssrRender(request, options)
    : csrRender(options.html));

  return transformResponse(response, injectServerData(serverData));
}

function matchRoute(
  req: Request,
  routes: ServerRoute[],
): ServerRoute | undefined {
  const sorted = routes.sort(sortRoutes);
  for (const route of sorted) {
    const pathname = getPathname(req);

    if (pathname.startsWith(route.urlPath)) {
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
  nodeReq?: IncomingMessage,
): 'ssr' | 'csr' | 'data' {
  const query = parseQuery(req);

  const fallbackHeader = `x-${cutNameByHyphen(framework)}-ssr-fallback`;

  if (isSSR) {
    if (query.__loader) {
      return 'data';
    }
    if (
      forceCSR &&
      (query.csr ||
        req.headers.get(fallbackHeader) ||
        nodeReq?.headers[fallbackHeader])
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

function injectServerData(serverData: Record<string, any>) {
  const { head } = REPLACE_REG.before;
  const searchValue = new RegExp(head);

  const replcaeCb = (beforeHead: string) =>
    `${beforeHead}<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      serverData,
    )}</script>`;

  return (template: string) => template.replace(searchValue, replcaeCb);
}
