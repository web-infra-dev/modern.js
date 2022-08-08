// Todo 看看是不是能 fork 一份，即使命中也返回
import { IncomingMessage } from 'http';
import serve from 'serve-static';
import { isString, isRegExp } from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/core';
import { useLocalPrefix } from '../utils';
import { NextFunction } from '../type';
import { ModernServerContext } from './context';

type Rule = {
  path: string | RegExp;
  target: string;
};

const removedPrefix = (req: IncomingMessage, prefix: string) => {
  if (useLocalPrefix(prefix)) {
    req.url = req.url!.slice(prefix.length);
    return () => {
      req.url = prefix + req.url!;
    };
  } else {
    return () => {
      // emptyy
    };
  }
};

export const createStaticFileHandler =
  (rules: Rule[], output: NormalizedConfig['output'] = {}) =>
  // eslint-disable-next-line consistent-return
  async (context: ModernServerContext, next: NextFunction) => {
    const { url: requestUrl, req, res } = context;
    const { assetPrefix = '/' } = output;

    const hitRule = rules.find(item => {
      if (isString(item.path) && requestUrl.startsWith(item.path)) {
        return true;
      } else if (isRegExp(item.path) && item.path.test(requestUrl)) {
        return true;
      }
      return false;
    });

    if (hitRule) {
      const resume = removedPrefix(req, assetPrefix);
      serve(hitRule.target)(req, res, () => {
        resume();
        next();
      });
    } else {
      return next();
    }
  };
