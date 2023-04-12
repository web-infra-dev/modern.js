import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { compatRequire, fs } from '@modern-js/utils';
import type { ModernServerContext, NextFunction } from '@modern-js/types';
import { AGGRED_DIR } from '@modern-js/prod-server';
import getMockData, { getMatched } from './getMockData';

type MockConfig = {
  enable: ((req: IncomingMessage, res: ServerResponse) => boolean) | boolean;
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

  const mod = compatRequire(filepath, false);
  // To ensure compatibility with CommonJS syntax, add default mock as mod.
  // For use mock config, it must use ESM syntax.
  const { default: mockModule = mod, config } = mod;

  if (config?.enable === false) {
    return null;
  }

  if (!mockModule) {
    throw new Error(`Mock file ${filepath} parsed failed!`);
  }

  const apiList = getMockData(mockModule);
  if (!apiList || apiList.length === 0) {
    return null;
  }

  return async (context: ModernServerContext, next: NextFunction) => {
    if (typeof config?.enable === 'function') {
      const enableMock = config.enable(context.req, context.res);

      if (!enableMock) {
        return next();
      }
    }

    const { res } = context;
    const matched = getMatched(context, apiList);

    if (!matched) {
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return matched.handler(context, next);
  };
};
