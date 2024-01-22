import { HonoRequest } from '../types';

export const getRuntimeEnv = () => {
  if (global?.process?.release?.name === 'node') {
    return 'node';
  }
  return 'other';
};

export const checkIsProd = (): boolean => {
  const runtimeEnv = getRuntimeEnv();
  switch (runtimeEnv) {
    case 'node':
      return process.env.NODE_ENV === 'production';

    // TODO: check is prodcution in other runtime env
    case 'other':
    default:
      return false;
  }
};

export type CollectMiddlewaresResult = {
  web: any[];
  api: any[];
};

export const mergeExtension = (users: any[]) => {
  const output: any[] = [];
  return { middleware: output.concat(users) };
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

const ERROR_PAGE_TEXT: Record<number, string> = {
  404: 'This page could not be found.',
  500: 'Internal Server Error.',
};

export const createErrorHtml = (status: number) => {
  const text = ERROR_PAGE_TEXT[status] || '';
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

export const getHost = (req: HonoRequest) => {
  let host = req.header('X-Forwarded-Host');
  if (!host) {
    host = req.header('Host');
  }
  host = (host as string).split(/\s*,\s*/, 1)[0] || 'undefined';
  // the host = '',if we can't cat Host or X-Forwarded-Host header
  // but the this.href would assign a invalid value:`http[s]://${pathname}`
  // so we need assign host a no-empty value.
  return host;
};
