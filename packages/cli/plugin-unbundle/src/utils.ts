import path from 'path';
// eslint-disable-next-line node/no-deprecated-api
import { parse as parseUrl } from 'url';
import { fs, chalk, signale as logger } from '@modern-js/utils';
import { Loader } from 'esbuild';
import { Server } from '@modern-js/server';

import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  CSS_REGEX,
  CSS_MODULE_REGEX,
  WEB_MODULES_DIR,
  META_DATA_FILE_NAME,
  BFF_API_DIR,
} from './constants';

export const jsLangRE = /\.(jsx?|tsx?)($|\?)/;
export const isJsRequest = (url: string): boolean => jsLangRE.test(url);

export const isCSSRequest = (url: string): boolean =>
  CSS_REGEX.test(url) || CSS_MODULE_REGEX.test(url);

export const directCSSQueryRE = /(\?|&)direct(&|$)/;
export const isDirectCSSRequest = (url: string): boolean => {
  if (!isCSSRequest(url)) {
    return false;
  }
  return directCSSQueryRE.test(url);
};

export const assetQueryRE = /(\?|&)assets(&|$)/;
export const isAssetRequest = (url: string): boolean => assetQueryRE.test(url);

export const ensureLeadingSlash = (s: string) =>
  s.startsWith('/') ? s : `/${s}`;

export const cleanUrl = (s: string) => s.replace(/(\?.*$|#.*$)/, '');

export const isFunction = (o: unknown) =>
  Object.prototype.toString.call(o) === '[object Function]';

export const hasBffPlugin = (appDirectory: string): boolean => {
  const packageJson = require(path.join(appDirectory, 'package.json'));
  const { dependencies, devDependencies } = packageJson;
  const hasPlugin = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ].some(name => name.includes('plugin-bff'));

  return hasPlugin;
};

export const shouldUseBff = (appDirectory: string): boolean => {
  const existBffPlugin = hasBffPlugin(appDirectory);

  return (
    fs.existsSync(path.resolve(appDirectory, BFF_API_DIR)) && existBffPlugin
  );
};

export const getBFFMiddleware = async (
  config: NormalizedConfig,
  appContext: IAppContext,
) => {
  const server = new Server({
    dev: true,
    apiOnly: true,
    config,
    pwd: appContext.appDirectory,
    plugins: appContext.plugins.filter(p => p.server).map(p => p.server),
    routes: appContext.serverRoutes as any,
  });

  await server.init();

  const handler = server.getRequestHandler();

  return handler;
};

export const replaceAsync = (
  str: string,
  searchValue: RegExp,
  replacer: (match: string, $1: string) => Promise<string>,
) => {
  try {
    if (typeof replacer === 'function') {
      // 1. Run fake pass of `replace`, collect values from `replacer` calls
      // 2. Resolve them with `Promise.all`
      // 3. Run `replace` with resolved values
      const values: any[] = [];
      String.prototype.replace.call(str, searchValue, (...args) => {
        // eslint-disable-next-line prefer-spread
        values.push(replacer.apply(undefined, args as any));
        return '';
      });
      return Promise.all(values).then(resolvedValues =>
        String.prototype.replace.call(str, searchValue, () =>
          resolvedValues.shift(),
        ),
      );
    } else {
      return Promise.resolve(
        String.prototype.replace.call(str, searchValue, replacer),
      );
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

export const addQuery = (urlPath: string, query: string) => {
  const { search, pathname } = parseUrl(urlPath);
  return search ? `${pathname!}${search}&${query}` : `${pathname!}?${query}`;
};

const pkgMap: Map<string, string> = new Map();
export const findPackageJson = (file: string) => {
  const cached = pkgMap.get(file);

  if (cached) {
    return cached;
  }

  let current = file;

  let dirname: string;

  while ((dirname = path.dirname(current)) !== '/') {
    const pkgFile = path.resolve(dirname, 'package.json');
    if (fs.existsSync(pkgFile)) {
      const json = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (json.name && json.version && !json.private) {
        pkgMap.set(file, pkgFile);
        return pkgFile;
      }
    }
    current = dirname;
  }
};

export const normalizePackageName = (specifier: string): string => {
  const splits = specifier.split('/');
  if (specifier.startsWith('@')) {
    return `${splits[0]}/${splits[1]}`;
  } else {
    return splits[0];
  }
};

export const getEsbuildLoader = (filename: string): Loader => {
  const ext = path.extname(filename);
  switch (ext) {
    case '.svg': {
      return 'jsx' as Loader;
    }
    case '.js': {
      return 'jsx' as Loader;
    }
    default: {
      return ext.slice(1) as Loader;
    }
  }
};

export const shouldEnableBabelMacros = (appDirectory: string): boolean => {
  const metaFilePath = path.resolve(
    appDirectory,
    WEB_MODULES_DIR,
    META_DATA_FILE_NAME,
  );

  try {
    const json = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
    return Boolean(json.enableBabelMacros);
  } catch (err) {
    return false;
  }
};

export const hasDependency = (appDirectory: string, depName: string) => {
  const { dependencies = {}, devDependencies = {} } = fs.readJSONSync(
    path.resolve(appDirectory, './package.json'),
  );

  return (
    dependencies.hasOwnProperty(depName) ||
    devDependencies.hasOwnProperty(depName)
  );
};

export const pathToUrl = (p: string) => p.split(path.sep).join('/');

export const logWithHistory = () => {
  let count = 1;
  let history = '';
  return (message: string) => {
    process.stdout.moveCursor(0, -1); // up one line
    process.stdout.clearLine(1); // clear last line
    if (message === history) {
      count += 1;
      logger.info(chalk.green(`${message} x${count}`));
    } else {
      history = message;
      count = 1;
      logger.info(chalk.green(message));
    }
  };
};

export const setIgnoreDependencies = (
  userConfig: NormalizedConfig,
  virtualDeps: Record<string, string>,
) => {
  const ignore = userConfig?.dev?.unbundle?.ignore;
  if (!ignore) {
    return;
  }

  const normalizeIgnore = Array.isArray(ignore) ? ignore : [ignore];
  normalizeIgnore.forEach(dependencyToIgnore => {
    virtualDeps[dependencyToIgnore] = `
      /**
       * Dependency ${dependencyToIgnore} ignored via user config
       * /
      export {};
      export default {};
    `;
  });
};
