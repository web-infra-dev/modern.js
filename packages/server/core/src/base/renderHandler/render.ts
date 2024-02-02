import path from 'path';
import { Logger, ServerRoute } from '@modern-js/types';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { cutNameByHyphen } from '@modern-js/utils';
import { parseQuery } from '../libs/request';
import { createErrorHtml } from '../libs/utils';
import { ssrRender } from './ssrRender';

declare global {
  interface Request {
    $logger: Logger;
  }
}

type Render = (request: Request) => Promise<Response>;

interface CreateRenderOptions {
  routes: ServerRoute[];
  pwd: string;
  staticGenerate?: boolean;
  metaName?: string;
  forceCSR?: boolean;
}

export function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  forceCSR,
}: CreateRenderOptions): Render {
  return async req => {
    const routeInfo = matchRoute(req, routes);

    if (!routeInfo) {
      return new Response(createErrorHtml(404), {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
      });
    }

    const htmlPath = path.join(pwd, routeInfo.entryPath);

    const html = (await fileReader.readFile(htmlPath))?.toString();

    if (!html) {
      throw new Error(`Can't found html in the path: ${htmlPath}`);
    }

    const renderMode = getRenderMode(
      req,
      metaName || 'modern-js',
      routeInfo.isSSR,
      forceCSR,
    );

    return renderMode === 'csr'
      ? csrRender(html)
      : ssrRender(req, {
          pwd,
          mode: 'string',
          html,
          routeInfo,
          staticGenerate: staticGenerate || false,
          metaName: metaName || 'modern-js',
        });
  };
}

function matchRoute(
  req: Request,
  routes: ServerRoute[],
): ServerRoute | undefined {
  // TODO: adpater params
  for (const route of routes) {
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
): 'ssr' | 'csr' {
  const query = parseQuery(req.url);

  if (isSSR) {
    if (
      (forceCSR && query.csr) ||
      req.headers.get(`x-${cutNameByHyphen(framework)}-ssr-fallback`)
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
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  });
}
