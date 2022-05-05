import type { NormalizedConfig } from '@modern-js/core';
import { compile } from 'path-to-regexp';
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

export const toPath = (reg: string, params: Record<string, any>) => {
  const fn = compile(reg, { encode: encodeURIComponent });
  return fn(params);
};

export const getStaticReg = (output: NormalizedConfig['output'] = {}) => {
  const { favicon, faviconByEntries, cssPath, jsPath, mediaPath } = output;
  const favicons = prepareFavicons(favicon, faviconByEntries);
  const staticFiles = [cssPath, jsPath, mediaPath].filter(v => Boolean(v));

  const staticPathRegExp = new RegExp(
    `^/(static/|upload/|favicon.ico|icon.png${
      favicons.length > 0 ? `|${favicons.join('|')}` : ''
    }${staticFiles.length > 0 ? `|${staticFiles.join('|')}` : ''})`,
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
