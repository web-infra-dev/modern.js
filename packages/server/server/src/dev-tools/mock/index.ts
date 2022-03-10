import path from 'path';
import { fs } from '@modern-js/utils';
import { ModernServerContext, NextFunction } from '@modern-js/types';
import { AGGRED_DIR } from '@modern-js/prod-server';
import getMockData, { getMatched } from './getMockData';

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

    res.setHeader('Access-Control-Allow-Origin', '*');
    return matched.handler(context, next);
  };
};
