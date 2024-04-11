// The following code is modified based on https://github.com/honojs/hono/blob/main/src/middleware/logger/index.ts
// license at https://github.com/honojs/hono/blob/main/LICENSE
import { Middleware } from '../../core/server';
import { getPathname } from '../utils';

enum LogPrefix {
  Outgoing = '-->',
  Incoming = '<--',
  Error = 'xxx',
}

const humanize = (times: string[]) => {
  const [delimiter, separator] = [',', '.'];

  const orderTimes = times.map(v =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${delimiter}`),
  );

  return orderTimes.join(separator);
};

const time = (start: number) => {
  const delta = Date.now() - start;
  return humanize([
    delta < 1000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`,
  ]);
};

const colorStatus = (status: number) => {
  const out: { [key: string]: string } = {
    7: `\x1b[35m${status}\x1b[0m`,
    5: `\x1b[31m${status}\x1b[0m`,
    4: `\x1b[33m${status}\x1b[0m`,
    3: `\x1b[36m${status}\x1b[0m`,
    2: `\x1b[32m${status}\x1b[0m`,
    1: `\x1b[32m${status}\x1b[0m`,
    0: `\x1b[33m${status}\x1b[0m`,
  };

  const calculateStatus = Math.floor(status / 100);

  return out[calculateStatus];
};

type PrintFunc = (str: string, ...rest: string[]) => void;

function log(
  fn: PrintFunc,
  prefix: string,
  method: string,
  path: string,
  status = 0,
  elapsed?: string,
) {
  const out =
    prefix === LogPrefix.Incoming
      ? `  ${prefix} ${method} ${path}`
      : `  ${prefix} ${method} ${path} ${colorStatus(status)} ${elapsed}`;
  fn(out);
}

export function logHandler(): Middleware {
  return async function logger(c, next) {
    const { method } = c.req;
    const logger = c.get('logger');
    const path = getPathname(c.req.raw);
    const logFn = logger.info;
    log(logFn, LogPrefix.Incoming, method, path);
    const start = Date.now();
    await next();
    log(logFn, LogPrefix.Outgoing, method, path, c.res.status, time(start));
  };
}
