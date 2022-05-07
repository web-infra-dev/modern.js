import * as path from 'path';
import { PackageJsonLookup } from '@rushstack/node-core-library';
import { globby, GlobbyOptions } from '@modern-js/utils';
import pMap from 'p-map';
import { errorLog } from '../log/error';
import { Package } from '../package';

const normalize = (results: string[]) =>
  results.map((fp: string) => path.normalize(fp));

const getGlobOpts = (
  rootPath: string,
  packageConfigs: string[],
  ignore: string[] = [],
): GlobbyOptions => {
  const globOpts: any = {
    cwd: rootPath,
    absolute: true,
    expandDirectories: false,
    followSymbolicLinks: false,
  };

  if (packageConfigs.some((cfg: string) => cfg.includes('**'))) {
    if (packageConfigs.some((cfg: string) => cfg.includes('node_modules'))) {
      errorLog(
        'An explicit node_modules package path does not allow globstars (**)',
      );
    }

    globOpts.ignore = [
      // allow globs like "packages/**",
      // but avoid picking up node_modules/**/package.json and dist/**/package.json
      '**/dist/**',
      '**/node_modules/**',
      ...(ignore || []),
    ];
  }

  return globOpts;
};

const makeFileFinder = (
  rootPath: string,
  packageConfigs: string[],
  ignoreConfigs: string[] = [],
) => {
  const globOpts = getGlobOpts(rootPath, packageConfigs, ignoreConfigs);

  return async <FileMapperType>(
    fileName: string,
    fileMapper: (filepath: string[]) => Promise<FileMapperType[]>,
    customGlobOpts: GlobbyOptions = {},
  ) => {
    const options = { ...customGlobOpts, ...globOpts };
    const promise = pMap(
      Array.from(packageConfigs).sort(),
      async (globPath: string) => {
        let result = await globby(path.posix.join(globPath, fileName), options);

        // fast-glob does not respect pattern order, so we re-sort by absolute path
        result = result.sort();
        // POSIX results always need to be normalized
        result = normalize(result);

        return fileMapper(result);
      },
      { concurrency: packageConfigs.length || Infinity },
    );

    // always flatten the results
    const results = await promise;

    return results.reduce((acc, result) => acc.concat(result), []);
  };
};

export const getProjectsByPackageConfig = async (
  rootPath: string,
  packagesConfig: string[],
  ignoreConfigs: string[],
) => {
  const finder = makeFileFinder(rootPath, packagesConfig, ignoreConfigs);
  const fileName = 'package.json';
  const mapper = (packageConfigPath: string) => {
    const packageJsonLookup = new PackageJsonLookup({ loadExtraFields: true });
    const packageJson =
      packageJsonLookup.loadNodePackageJson(packageConfigPath);
    return new Package(packageJson, path.dirname(packageConfigPath), rootPath);
  };
  const projects = await finder(
    fileName,
    filePaths =>
      pMap(filePaths, mapper, { concurrency: filePaths.length || Infinity }),
    {},
  );

  return projects;
};

const makeSyncFileFinder = (
  rootPath: string,
  packageConfigs: string[],
  ignoreConfigs: string[] = [],
) => {
  const globOpts = getGlobOpts(rootPath, packageConfigs, ignoreConfigs);

  return <FileMapperType>(
    fileName: string,
    fileMapper: (filepath: string[]) => FileMapperType[],
    customGlobOpts: GlobbyOptions = {},
  ) => {
    const results: FileMapperType[][] = [];

    const options = { ...customGlobOpts, ...globOpts };
    for (const globPath of Array.from(packageConfigs).sort()) {
      let result = globby.sync(path.posix.join(globPath, fileName), options);
      // fast-glob does not respect pattern order, so we re-sort by absolute path
      result = result.sort();
      // POSIX results always need to be normalized
      result = normalize(result);

      results.push(fileMapper(result));
    }

    return results.reduce((acc, result) => acc.concat(result), []);
  };
};

export const syncGetProjectsByPackageConfig = (
  rootPath: string,
  packagesConfig: string[],
  ignoreConfigs: string[],
) => {
  const finder = makeSyncFileFinder(rootPath, packagesConfig, ignoreConfigs);
  const fileName = 'package.json';
  const mapper = (packageConfigPath: string) => {
    const packageJsonLookup = new PackageJsonLookup({ loadExtraFields: true });
    const packageJson =
      packageJsonLookup.loadNodePackageJson(packageConfigPath);
    return new Package(packageJson, path.dirname(packageConfigPath), rootPath);
  };
  const projects = finder(
    fileName,
    filePaths => filePaths.map(filePath => mapper(filePath)),
    {},
  );

  return projects;
};
