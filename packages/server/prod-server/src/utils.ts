import { IncomingMessage } from 'http';
import type {
  OutputNormalizedConfig,
  HtmlNormalizedConfig,
} from '@modern-js/server-core';
import { createDebugger } from '@modern-js/utils';

export const debug = createDebugger('prod-server') as any;

export const mergeExtension = (users: any[]) => {
  const output: any[] = [];
  return { middleware: output.concat(users) };
};

export const noop = () => {
  // noop
};

export const createErrorDocument = (status: number, text: string) => {
  const title = `${status}: ${text}`;
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${title}</title>
    <style>
      html,body {
        margin: 0;
      }

      .page-container {
        color: #000;
        background: #fff;
        height: 100vh;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="page-container">
    <h1>${status}</h1>
    <div>${text}</div>
  </body>
  </html>
  `;
};

export type CollectMiddlewaresResult = {
  web: any[];
  api: any[];
};

export const createMiddlewareCollecter = () => {
  const webMiddlewares: any[] = [];
  const apiMiddlewares: any[] = [];

  const addWebMiddleware = (input: any) => {
    webMiddlewares.push(input);
  };

  const addAPIMiddleware = (input: any) => {
    apiMiddlewares.push(input);
  };

  const getMiddlewares = (): CollectMiddlewaresResult => ({
    web: webMiddlewares,
    api: apiMiddlewares,
  });
  return {
    getMiddlewares,
    addWebMiddleware,
    addAPIMiddleware,
  };
};

export const getStaticReg = (
  output: OutputNormalizedConfig = {},
  html: HtmlNormalizedConfig = {},
  prefix = '/',
) => {
  const { distPath: { css: cssPath, js: jsPath, media: mediaPath } = {} } =
    output;
  const { favicon, faviconByEntries } = html;
  const favicons = prepareFavicons(favicon, faviconByEntries);
  const staticFiles = [cssPath, jsPath, mediaPath].filter(v => Boolean(v));

  const staticReg = ['static/', 'upload/', ...staticFiles];
  const iconReg = ['favicon.ico', 'icon.png', ...favicons];

  const regPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const staticPathRegExp = new RegExp(
    `^${regPrefix}(${[...staticReg, ...iconReg].join('|')})`,
  );

  return staticPathRegExp;
};

export const prepareFavicons = (
  favicon: string | undefined,
  faviconByEntries?: Record<string, string | undefined>,
) => {
  const faviconNames = [];
  if (favicon) {
    faviconNames.push(favicon.substring(favicon.lastIndexOf('/') + 1));
  }
  if (faviconByEntries) {
    Object.keys(faviconByEntries).forEach(f => {
      const curFavicon = faviconByEntries[f];
      if (curFavicon) {
        faviconNames.push(
          curFavicon.substring(curFavicon.lastIndexOf('/') + 1),
        );
      }
    });
  }
  return faviconNames;
};

export const headersWithoutCookie = (headers: IncomingMessage['headers']) => {
  if (typeof headers.cookie !== 'undefined') {
    const safeHeaders = { ...headers };
    delete safeHeaders.cookie;
    return safeHeaders;
  }
  return headers;
};

export const isRedirect = (code: number) => {
  return [301, 302, 307, 308].includes(code);
};

/**
 * get body from request.
 * @return body -
 *  if req.method !== 'GET', it returns a string, otherwise it returns undefined
 */
const getRequestBody = (req: IncomingMessage): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    if (req?.method && req.method.toLowerCase() !== 'get') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        resolve(body);
      });

      req.on('error', err => {
        reject(err);
      });
    } else {
      resolve(undefined);
    }
  });

export const bodyParser = async (req: IncomingMessage) => {
  req.body = await getRequestBody(req);
};
