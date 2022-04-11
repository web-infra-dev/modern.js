import path from 'path';
import { fs } from './compiled';
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
  (pwd = '', namespace: string, ts = false) => {
    const entryExportFile = path.join(
      pwd,
      `.runtime-exports/${namespace ? `${namespace}.js` : 'index.js'}`,
    );
    const entryExportTsFile = path.join(
      pwd,
      `.runtime-exports/${namespace ? `${namespace}.d.ts` : 'index.d.ts'}`,
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
        fs.ensureFileSync(entryExportTsFile);

        if (!fs.readFileSync(entryExportFile, 'utf8').includes(statement)) {
          fs.appendFileSync(entryExportFile, `${statement}\n`);
          ts &&
            fs.appendFileSync(
              entryExportTsFile,
              `${statement.replace('.js', '.d')}\n`,
            );
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
