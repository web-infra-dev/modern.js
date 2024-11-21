import type { Stats } from 'fs';
import path from 'path';
import {
  bundleRequire,
  defaultGetOutputFile,
} from '@modern-js/node-bundle-require';
import { fs, CONFIG_CACHE_DIR, globby } from '@modern-js/utils';

/**
 * Get user config from package.json.
 * @param appDirectory - App root directory.
 * @returns modernConfig or undefined
 */
export const getPackageConfig = <T>(
  appDirectory: string,
  packageJsonConfig: string,
) => {
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
  );

  return json[packageJsonConfig] as T | undefined;
};

export const getConfigFilePath = (
  appDirectory: string,
  configFilePath: string,
) => {
  if (path.isAbsolute(configFilePath)) {
    return configFilePath;
  }
  return path.resolve(appDirectory, configFilePath);
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

/**
 * Parse and load user config file, support extensions like .ts, mjs, js, ejs.
 * @param appDirectory - App root directory, from which start search user config file.
 * @param configFile - Specific absolute config file path.
 * @returns Object contain config file path, user config object and dependency files used by config file.
 */
export const loadConfig = async <T>(
  appDirectory: string,
  configFile: string,
  packageJsonConfig?: string,
): Promise<{
  packageName: string;
  configFile: string;
  config?: T;
  pkgConfig?: T;
}> => {
  let pkgConfig: T | undefined;
  if (packageJsonConfig) {
    pkgConfig = getPackageConfig<T>(appDirectory, packageJsonConfig);
  }

  const packageName = require(
    path.resolve(appDirectory, './package.json'),
  ).name;

  let config: T | undefined;

  if (configFile) {
    delete require.cache[configFile];

    const mod = await bundleRequireWithCatch(configFile, { appDirectory });

    config = mod.default || mod;
  }

  return {
    packageName,
    configFile,
    config,
    pkgConfig,
  };
};
