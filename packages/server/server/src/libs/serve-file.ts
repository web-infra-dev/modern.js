// Todo 看看是不是能 fork 一份，即使命中也返回
import serve from 'serve-static';
import { NextFunction } from '../type';
import { ModernServerContext } from './context';

type Rule = {
  path: string;
  target: string;
};

export const createStaticFileHandler = (rules: Rule[]) => {
  const middlewares = rules.reduce(
    (map: Record<string, ReturnType<typeof serve>>, rule) => {
      map[rule.path] = serve(rule.target);
      return map;
    },
    {},
  );

  // eslint-disable-next-line consistent-return
  return async (context: ModernServerContext, next: NextFunction) => {
    const { url: requestUrl, req, res } = context;
    const hit = Object.keys(middlewares).find(u => requestUrl.startsWith(u));

    if (hit) {
      // when matches static resources, delete the first layer of req.url
      const removed = hit;
      context.url = requestUrl.slice(removed.length - 1);
      middlewares[hit](req, res, () => {
        // will invok next, recover req.url
        context.url = removed + context.url;
        next();
      });
    } else {
      return next();
    }
  };
};
