import { Middleware } from 'koa';
import {
  chalk,
  stripAnsi,
  createDebugger,
  signale as logger,
} from '@modern-js/utils';
import { ESMServer } from '../server';

const debug = createDebugger(`esm:error`);

function cleanStack(stack: string) {
  return stack
    .split(/\n/g)
    .filter(l => /^\s*at/.test(l))
    .join('\n');
}

export const errorOverlayMiddleware = (server: ESMServer): Middleware => {
  const { wsServer } = server;

  return async (ctx, next) => {
    try {
      const start = Date.now();
      await next();
      const end = Date.now();
      debug(`${ctx.url} -> ${end - start}ms`);
    } catch (err: any) {
      const errorMessage = [
        chalk.redBright(`Internal server error: ${err.message}`),
        chalk.yellow(err.frame || ''),
        chalk.dim(cleanStack(err.stack || '')),
      ]
        .filter(Boolean)
        .join('\n');

      logger.error(errorMessage);

      debug(`send error message`, err.message);

      wsServer.send({
        type: 'error',
        title: err?.constructor?.name || '',
        message: stripAnsi(err.message),
        stack: stripAnsi(cleanStack(err.stack || '')),
        frame: stripAnsi(err.frame || ''),
        loc: err.loc,
      });

      ctx.status = 500;
      ctx.body = '';
    }
  };
};
