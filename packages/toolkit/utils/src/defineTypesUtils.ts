import path from 'path';
import fs from 'fs-extra';
import { normalizeOutputPath } from './path';

const memo = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map();

  return (...params: Parameters<T>): ReturnType<T> => {
    const stringifiedParams = JSON.stringify(params);
    const cachedResult = cache.get(stringifiedParams);

    if (cachedResult) {
      return cachedResult;
    }

    const res = fn(...params);
    cache.set(stringifiedParams, res);

    return res;
  };
};

export const createDefineTypesUtils = memo((pwd: string, namespace = '') => {
  const defineTypesFile = path.join(
    pwd,
    `types/${namespace ? `${namespace}.d.ts` : 'index.d.ts'}`,
  );

  const addTypes = (statement: string) => {
    // eslint-disable-next-line no-param-reassign
    statement = normalizeOutputPath(statement);
    try {
      fs.ensureFileSync(defineTypesFile);
      if (!fs.readFileSync(defineTypesFile, 'utf8').includes(statement)) {
        fs.appendFileSync(defineTypesFile, `${statement}\n`);
      }
    } catch {
      // FIXME:
    }
  };

  const getPath = () => defineTypesFile;

  return {
    addTypes,
    getPath,
  };
});
