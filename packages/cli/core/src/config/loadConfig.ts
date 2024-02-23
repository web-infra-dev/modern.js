import path from 'path';
import type { Stats } from 'fs';
import {
  findExists,
  fs,
  createDebugger,
  CONFIG_FILE_EXTENSIONS,
  CONFIG_CACHE_DIR,
  globby,
} from '@modern-js/utils';
import {
  bundleRequire,
  defaultGetOutputFile,
} from '@modern-js/node-bundle-require';

const debug = createDebugger('load-config');

export const CONFIG_FILE_NAME = 'modern.config';

export const LOCAL_CONFIG_FILE_NAME = 'modern.config.local';

export const PACKAGE_JSON_CONFIG_NAME = 'modernConfig';

/**
 * Get user config from package.json. If package.json do not exist, function will return `undefined`
 * @param appDirectory - App root directory.
 * @returns modernConfig or undefined
 */
export const getPackageConfig = <T>(
  appDirectory: string,
  packageJsonConfig?: string,
) => {
  const pkgJsonFilePath = path.resolve(appDirectory, './package.json');

  if (!fs.pathExistsSync(pkgJsonFilePath)) {
    return undefined;
  }

  const json = JSON.parse(fs.readFileSync(pkgJsonFilePath, 'utf8'));

  return json[packageJsonConfig ?? PACKAGE_JSON_CONFIG_NAME] as T | undefined;
};

/**
 * Get the file dependencies by module.children, ignore file path in node_modules and this monorepo packages default.
 * @param filePath - Absolute file path.
 * @returns File dependencies array.
 */
export const getDependencies = (filePath: string): string[] => {
  const mod: NodeModule | undefined = require.cache[filePath];

  if (!mod) {
    debug(`${filePath} has not been required yet`);
    return [];
  }

  const deps: string[] = [];

  if (!/\/node_modules\/|\/modern-js\/packages\//.test(mod.id)) {
    deps.push(mod.id);
    for (const child of mod.children) {
      deps.push(...getDependencies(child.id));
    }
  }

  return deps;
};

/**
 *
 * @param targetDir target dir
 * @param overtime Unit of second
 */
export const clearFilesOverTime = async (
  targetDir: string,
  overtime: number,
) => {
  try {
    // when stats is true, globby return Stats[]
    const files = (await globby(`${targetDir}/**/*`, {
      stats: true,
      absolute: true,
    })) as unknown as { stats: Stats; path: string }[];
    const currentTime = Date.now();
    if (files.length > 0) {
      for (const file of files) {
        if (currentTime - file.stats.birthtimeMs >= overtime * 1000) {
          fs.unlinkSync(file.path);
        }
      }
    }
  } catch (err) {
    // ignore error when clear files
  }
};

const bundleRequireWithCatch = async (
  configFile: string,
  { appDirectory }: { appDirectory: string },
): Promise<any> => {
  try {
    const mod = await bundleRequire(configFile, {
      autoClear: false,
      getOutputFile: async (filePath: string) => {
        const defaultOutputFileName = path.basename(
          await defaultGetOutputFile(filePath),
        );
        const outputPath = path.join(appDirectory, CONFIG_CACHE_DIR);
        // 10 min
        const timeLimit = 10 * 60;
        await clearFilesOverTime(outputPath, timeLimit);
        return path.join(outputPath, defaultOutputFileName);
      },
    });

    return mod;
  } catch (e) {
    if (e instanceof Error) {
      e.message = `Get Error while loading config file: ${configFile}, please check it and retry.\n${
        e.message || ''
      }`;
    }
    throw e;
  }
};

export const getConfigFilePath = (appDirectory: string, filePath?: string) => {
  if (filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(appDirectory, filePath);
  }
  return findExists(
    CONFIG_FILE_EXTENSIONS.map(extension =>
      path.resolve(appDirectory, `${CONFIG_FILE_NAME}${extension}`),
    ),
  );
};

/**
 * Parse and load user config file, support extensions like .ts, mjs, js, ejs.
 * @param appDirectory - App root directory, from which start search user config file.
 * @param configFile - Specific absolute config file path.
 * @returns Object contain config file path, user config object and dependency files used by config file.
 */
export const loadConfig = async <T>(
  appDirectory: string,
  configFile: string | false,
  packageJsonConfig?: string,
  loadedConfig?: T,
): Promise<{
  path: string | false;
  config?: T;
  dependencies?: string[];
  pkgConfig?: T;
}> => {
  const pkgConfig = getPackageConfig<T>(appDirectory, packageJsonConfig);

  let config: T | undefined;

  const dependencies = pkgConfig
    ? [path.resolve(appDirectory, './package.json')]
    : [];

  if (loadedConfig) {
    config = loadedConfig;
  } else if (configFile) {
    delete require.cache[configFile];

    const mod = await bundleRequireWithCatch(configFile, { appDirectory });

    config = mod.default || mod;
  }

  return {
    path: configFile,
    config,
    pkgConfig,
    dependencies,
  };
};
