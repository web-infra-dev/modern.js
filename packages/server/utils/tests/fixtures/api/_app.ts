import { hook } from '../../../src';

export default hook(({ addMiddleware }) => {
  addMiddleware('@koa/api');
});
