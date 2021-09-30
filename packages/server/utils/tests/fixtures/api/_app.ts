import { hook } from '../../..';

export default hook(({ addMiddleware }) => {
  addMiddleware('@koa/api');
});
