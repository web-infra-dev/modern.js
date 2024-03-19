import { ServerRoute } from '@modern-js/types';
import { REPLACE_REG } from '../../../base/constants';
import { Render } from '../../../core/render';
import {
  createErrorHtml,
  sortRoutes,
  cutNameByHyphen,
  parseQuery,
  createTransformStream,
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
    { logger, nodeReq, reporter, templates, serverManifest },
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

  return injectServerData(response, serverData);
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

function injectServerData(
  response: Response,
  serverData: Record<string, any>,
): Response {
  const { head } = REPLACE_REG.before;
  const searchValue = new RegExp(head);

  const replcaeCb = (beforeHead: string) =>
    `${beforeHead}<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      serverData,
    )}</script>`;

  let readable: ReadableStream | null = null;
  if (response.body) {
    const stream = createTransformStream(before => {
      return before.replace(searchValue, replcaeCb);
    });

    response.body.pipeThrough(stream);

    // eslint-disable-next-line prefer-destructuring
    readable = stream.readable;
  }

  return new Response(readable, {
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
  });
}
