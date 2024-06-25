export const AGGRED_DIR = {
  mock: 'config/mock',
  server: 'server',
  api: 'api',
  shared: 'shared',
  lambda: 'lambda',
};

export const REPLACE_REG = {
  before: {
    head: '<head\\b[^>]*>',
    body: '<body\\b[^>]*>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

export enum ServerReportTimings {
  SERVER_HANDLE_REQUEST = 'server-handle-request',
  SERVER_MIDDLEWARE = 'server-middleware',
  SERVER_HOOK_AFTER_RENDER = 'server-hook-after-render',
  SERVER_HOOK_AFTER_MATCH = 'server-hook-after-match',
}

export const X_RENDER_CACHE = 'x-render-cache';
export const X_MODERNJS_RENDER = 'x-modernjs-render';
