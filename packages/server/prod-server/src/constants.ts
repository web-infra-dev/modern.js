export const AGGRED_DIR = {
  mock: 'config/mock',
  server: 'server',
  api: 'api',
  shared: 'shared',
  lambda: 'lambda',
};

export enum ApiServerMode {
  func = 'function',
  frame = 'framework',
}

export const ERROR_DIGEST = {
  INIT: 'Server init error',
  ENOTF: 'Page could not be found',
  WARMUP: 'SSR warmup failed',
  EINTER: 'Internal server error',
  ERENDER: 'SSR render failed',
  EMICROINJ: 'Get micro-frontend info failed',
};

export const ERROR_PAGE_TEXT: Record<number, string> = {
  404: 'This page could not be found.',
  500: 'Internal Server Error.',
};

export const RUN_MODE = {
  FULL: 'full',
  TYPE: 'type',
};
