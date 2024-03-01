import { ServerRoute } from '@modern-js/types';
import { cutNameByHyphen } from '@modern-js/utils';
import { Render } from '../../../core/render';
import { parseQuery } from '../../utils/request';
import { createErrorHtml, sortRoutes } from '../../utils';
import { ssrRender } from './ssrRender';

interface CreateRenderOptions {
  routes: ServerRoute[];
  pwd: string;
  staticGenerate?: boolean;
  metaName?: string;
  forceCSR?: boolean;
  nonce?: string;
}

export function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  forceCSR,
  nonce,
}: CreateRenderOptions): Render {
  return async (req, { logger, nodeReq, reporter, tpls }) => {
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

    return renderMode === 'csr'
      ? csrRender(html)
      : ssrRender(req, {
          pwd,
          html,
          routeInfo,
          staticGenerate: staticGenerate || false,
          metaName: metaName || 'modern-js',
          nonce,
          logger,
          nodeReq,
          reporter,
        });
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
): 'ssr' | 'csr' {
  const query = parseQuery(req);

  if (isSSR) {
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
