// Mutation negative: passes every static assertion (file location, official
// import, middleware with await next(), x-eval header) but contains a
// deliberate type error elsewhere -> build fails. Verifies the build gate.
import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const handler: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set('x-eval', '1');
};

const broken: number = 'not-a-number';

export default defineServerConfig({
  middlewares: [{ name: 'x-eval-header', handler }],
});
