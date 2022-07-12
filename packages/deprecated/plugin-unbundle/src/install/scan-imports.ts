import ScanImportsModule from 'path';
import {
  isModernjsMonorepo,
  getMonorepoPackages,
  findMonorepoRoot,
  fs,
  fastGlob,
  createDebugger,
  isTypescript,
  applyOptionsChain,
} from '@modern-js/utils';
import { parse, init } from 'es-module-lexer';
import { loadConfig } from '@modern-js/utils/tsconfig-paths';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { LexerParseResult } from '../plugins/import-rewrite';
import { BARE_SPECIFIER_REGEX, BABEL_MACRO_EXTENSIONS } from '../constants';
import { normalizePackageName } from '../utils';
import { fsWatcher } from '../watcher';

const debug = createDebugger('esm:scan-imports');

let monorepoRootDir: string | undefined;

let monorepoPackages: Array<{ name: string; path: string }> = [];

let modernjsMonorepo = false;

let useBabelMacros = false;

const shouldScanSpecifierPackage = (
  config: NormalizedConfig,
  rootDir: string,
  packageDir: string,
  specifier: string,
): boolean => {
  const pkgName = normalizePackageName(specifier);

  const {
    source: { include },
  } = config;

  if (
    modernjsMonorepo &&
    packageDir.startsWith(ScanImportsModule.resolve(rootDir, './features'))
  ) {
    return true;
  }

  if (
    include?.some(d => (d instanceof RegExp ? d.test(pkgName) : d === pkgName))
  ) {
    return true;
  }

  return false;
};

export type DepSpecifier = {
  specifier: string;
  importer: string;
  forceCompile?: boolean;
};

// scan source code imports
export const scanImports = async (
  config: NormalizedConfig,
  { appDirectory }: IAppContext,
  defaultDependencies: string[],
  virtualDependenciesMap: Record<string, string>,
): Promise<{ deps: DepSpecifier[]; enableBabelMacros: boolean }> => {
  const {
    source: { alias },
  } = config;

  const start = Date.now();

  debug(`start scan imports start`);

  const aliasNames = Object.keys(
    applyOptionsChain({ '@': './src' }, alias as any),
  );

  if (isTypescript(appDirectory)) {
    const tsConfig = loadConfig(appDirectory);
    if (tsConfig.resultType === 'success' && tsConfig.paths) {
      aliasNames.push(...Object.keys(tsConfig.paths));
    }
  }

  monorepoRootDir = findMonorepoRoot(appDirectory);

  if (monorepoRootDir) {
    monorepoPackages = getMonorepoPackages(monorepoRootDir);
    modernjsMonorepo = isModernjsMonorepo(monorepoRootDir);
  }

  await init;

  const deps = removeDuplicate([
    ...(await scanFiles(
      config,
      appDirectory,
      aliasNames,
      virtualDependenciesMap,
    )),
    ...defaultDependencies
      .filter(name => {
        // deps which already installed will be transformed
        try {
          require.resolve(name, { paths: [appDirectory] });
        } catch (_err) {
          // should always transform virtual deps.
          return Boolean(virtualDependenciesMap[name]);
        }
        return true;
      })
      .map(name => ({
        specifier: name,
        importer: appDirectory,
      })),
  ]);

  debug(`scan imports result:`, deps);
  debug(`scan imports end, cost time ${Date.now() - start}ms`);

  return { deps, enableBabelMacros: useBabelMacros };
};

const seen: Map<string, boolean> = new Map();

const scanFiles = async (
  config: NormalizedConfig,
  dir: string,
  aliasNames: string[],
  virtualDependenciesMap: Record<string, string>,
): Promise<Array<DepSpecifier>> => {
  if (seen.has(dir)) {
    return [];
  }

  seen.set(dir, true);

  const files = await fastGlob(
    ['.js', '.ts', '.jsx', '.tsx'].map(ext => `./src/**/*${ext}`),
    {
      cwd: dir,
      ignore: [
        '**/node_modules/**',
        `**/${config.output.path!}/**`,
        '**/dist/**',
        '**/build/**',
        '**/output/**',
        '**/output_resource/**',
        `**/__test__/**`,
        `**/*.test.(js|ts|jsx|tsx)`,
        `**/*.spec.(js|ts|jsx|tsx)`,
        `**/*.stories.(js|ts|jsx|tsx)`,
        `**/*.node.(js|jsx|ts|tsx)`,
        '**/*.d.ts',
      ],
      absolute: true,
    },
  );

  debug(`scan imports src files:`, files);

  const ret: Array<DepSpecifier> = [];

  for (const file of files) {
    const result = await require('esbuild').transform(
      fs.readFileSync(file, 'utf8'),
      {
        // fix: can't use tsx loader for ts file
        // https://esbuild.github.io/content-types/#ts-vs-tsx
        loader: ScanImportsModule.extname(file).slice(1),
        sourcemap: false,
        sourcefile: file,
      },
    );

    const [imports]: LexerParseResult = parse(result.code);

    for (const { n: specifier } of imports) {
      // check if enable babel-plugin-macro
      if (specifier?.endsWith(BABEL_MACRO_EXTENSIONS)) {
        useBabelMacros = true;
      }

      if (virtualDependenciesMap[specifier!]) {
        continue;
      }

      if (
        specifier &&
        BARE_SPECIFIER_REGEX.test(specifier) &&
        !aliasNames.find(
          alias =>
            !alias.startsWith('@modern-js/runtime') &&
            alias.startsWith(specifier.split('/')[0]),
        ) &&
        !/\.(css|less|scss)$/.test(specifier)
      ) {
        if (monorepoRootDir) {
          const found = monorepoPackages.find(({ name }) =>
            specifier.startsWith(name),
          );

          // should compile monorepo packages
          if (found?.path) {
            // should scan package in  monorepo features dir
            // or package specified in source.transpiledDependencies
            if (
              shouldScanSpecifierPackage(
                config,
                monorepoRootDir,
                found.path,
                specifier,
              )
            ) {
              fsWatcher.add(found.path);
              ret.push(
                ...(await scanFiles(
                  config,
                  found.path,
                  aliasNames,
                  virtualDependenciesMap,
                )),
              );
            } else {
              ret.push({ specifier, importer: file, forceCompile: true });
            }
          } else {
            ret.push({ specifier, importer: file });
          }
        } else {
          ret.push({
            specifier,
            importer: file,
          });
        }
      }
    }
  }

  return ret;
};

const removeDuplicate = (deps: DepSpecifier[]): DepSpecifier[] => {
  const map = new Map<string, boolean>();
  const final = [];
  for (const dep of deps) {
    if (!map.has(dep.specifier)) {
      final.push(dep);
      map.set(dep.specifier, true);
    }
  }
  return final;
};
