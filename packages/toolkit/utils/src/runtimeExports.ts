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

export const createRuntimeExportsUtils = memo(
  (pwd: string, namespace: string) => {
    const entryExportFile = path.join(
      pwd,
      `.runtime-exports/${namespace ? `${namespace}.js` : 'index.js'}`,
    );

    // const ensure = () => {
    //   if (!fs.existsSync(entryExportFile)) {
    //     fs.outputFileSync(entryExportFile, '');
    //   }
    //   fs.ensureFileSync(entryExportFile);
    // };

    const addExport = (statement: string) => {
      // eslint-disable-next-line no-param-reassign
      statement = normalizeOutputPath(statement);
      try {
        fs.ensureFileSync(entryExportFile);
        if (!fs.readFileSync(entryExportFile, 'utf8').includes(statement)) {
          fs.appendFileSync(entryExportFile, `${statement}\n`);
        }
      } catch {
        // FIXME:
      }
    };

    const getPath = () => entryExportFile;

    return {
      addExport,
      getPath,
    };
  },
);
