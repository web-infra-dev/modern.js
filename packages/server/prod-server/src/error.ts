import { Logger } from '@modern-js/types';

export enum ErrorDigest {
  ENOTF = 'Page could not be found',
  EINTER = 'Internal server error',
  // INIT: 'Server init error',
  // WARMUP: 'SSR warmup failed',
  // ERENDER: 'SSR render failed',
  // EMICROINJ: 'Get micro-frontend info failed',
}

export function onError(
  logger: Logger,
  digest: ErrorDigest,
  error: Error | string,
  req?: Request,
) {
  const headers = req?.headers;
  headers?.delete('cookie');

  logger.error(
    req
      ? `Server Error - ${digest}, error = %s, req.url = %s, req.headers = %o`
      : `Server Error - ${digest}, error = %s`,
    error instanceof Error ? error.stack || error.message : error,
    req?.url,
    headers,
  );
}
