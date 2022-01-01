import path from 'path';
import { fs } from '@modern-js/utils';
import { match } from 'path-to-regexp';
import { NextFunction } from '../../type';
import { ModernServerContext } from '../../libs/context';
import getMockData, { MockApi } from './getMockData';
import { AGGRED_DIR } from '../../constants';

const getMatched = (context: ModernServerContext, mockApiList: MockApi[]) => {
  const { path: targetPathname, method: targetMethod } = context;

  const matched = mockApiList.find(mockApi => {
    const { method, path: pathname } = mockApi;
    if (method.toLowerCase() === targetMethod.toLowerCase()) {
      return match(pathname, {
        encode: encodeURI,
        decode: decodeURIComponent,
      })(targetPathname);
    }

    return false;
  });

  return matched;
};

export const createMockHandler = ({ pwd }: { pwd: string }) => {
  const exts = ['.ts', '.js'];
  let filepath = '';

  for (const ext of exts) {
    const maybeMatch = path.join(pwd, `${AGGRED_DIR.mock}/index${ext}`);
    if (fs.existsSync(maybeMatch)) {
      filepath = maybeMatch;
      break;
    }
  }

  if (!filepath) {
    return null;
  }

  const apiList = getMockData(filepath);
  if (!apiList || apiList.length === 0) {
    return null;
  }

  return async (context: ModernServerContext, next: NextFunction) => {
    const { res } = context;
    const matched = getMatched(context, apiList);

    if (!matched) {
      return next();
    }

    if (matched) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return matched.handler(context, next);
    } else {
      return next();
    }
  };
};
