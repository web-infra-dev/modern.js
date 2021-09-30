import { hook } from '@modern-js/server-utils';

export default hook(({ addMiddleware }) => {
  addMiddleware('@koa/api');
});
