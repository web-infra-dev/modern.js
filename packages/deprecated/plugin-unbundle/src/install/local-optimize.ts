import { createHash } from 'crypto';
import path from 'path';
import { chalk, fs, signale as logger, Signale } from '@modern-js/utils';
import enhancedResolve from 'enhanced-resolve';
import { Plugin as ESBuildPlugin } from 'esbuild';
import type { Compiler } from '@modern-js/esmpack';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { UnbundleDependencies } from 'src';
import {
  WEB_MODULES_DIR,
  GLOBAL_CACHE_DIR_NAME,
  TEMP_MODULES_DIR,
  META_DATA_FILE_NAME,
  ESBUILD_RESOLVE_PLUGIN_NAME,
} from '../constants';
import { findPackageJson, pathToUrl } from '../utils';
import { scanImports } from './scan-imports';
import { ModulesCache, normalizeSemverSpecifierVersion } from './modules-cache';

const resolve = enhancedResolve.create.sync({
  conditionNames: ['import', 'module', 'development', 'browser'],
  mainFields: ['browser', 'module', 'main'],
});
// init global local modules cache
export const modulesCache = new ModulesCache(GLOBAL_CACHE_DIR_NAME);

// local web_modules dir， bundled by esbuild
let webModulesDir: string;

// temp esm modules like node_modules
let tempModulesDir: string;

// const debug = createDebugger(`esm:local-optimize`);

const activeLogger = new Signale({
  interactive: true,
  scope: 'optimize-deps',
});

export interface DepsMetadata {
  hash: string;
  enableBabelMacros: boolean;
  map: Record<string, string>;
}

export type ResolvedDepsMap = Map<
  string,
  { version: string; filePath: string | null }
>;

const resolvedDepsMap: ResolvedDepsMap = new Map();

const resolveDepVersion = (
  dep: string,
  importer: string,
  virtualDependenciesMap: Record<string, string>,
): { version: string; filePath: string | null } => {
  const cached = resolvedDepsMap.get(`${dep}${importer}`);

  if (cached) {
    return cached;
  }

  let version = 'latest';
  let filePath = null;

  if (!virtualDependenciesMap[dep]) {
    try {
      const resolved = resolve(importer, dep);
      if (resolved) {
        const pkg = findPackageJson(resolved);

        version = pkg
          ? JSON.parse(fs.readFileSync(pkg, 'utf8')).version
          : 'latest';
        filePath = resolved;
      }
    } catch (err) {
      logger.error(`resolve ${dep} error.\n ${err as string}`);
    }
  }

  resolvedDepsMap.set(`${dep}${importer}`, {
    version,
    filePath,
  });

  return {
    version,
    filePath,
  };
};

export async function optimizeDeps({
  userConfig,
  appContext,
  dependencies,
}: {
  userConfig: NormalizedConfig;
  appContext: IAppContext;
  dependencies: UnbundleDependencies;
}) {
  const {
    defaultDeps: defaultDependencies,
    virtualDeps: virtualDependenciesMap,
    internalPackages,
  } = dependencies;

  const ignoreModuleCache =
    userConfig?.dev?.unbundle?.ignoreModuleCache ||
    process.env.SKIP_DEPS_CACHE === 'true';
  const clearPdnCache =
    userConfig?.dev?.unbundle?.clearPdnCache ||
    process.env.CLEAN_CACHE === 'true';
  const pdnHost =
    userConfig?.dev?.unbundle?.pdnHost || dependencies.defaultPdnHost;
  const timer = process.hrtime();

  const { appDirectory } = appContext;

  webModulesDir = path.resolve(appDirectory, WEB_MODULES_DIR);

  tempModulesDir = path.resolve(appDirectory, TEMP_MODULES_DIR);

  const dataPath = path.join(webModulesDir, META_DATA_FILE_NAME);

  // should clean global modules cache and local cache
  if (clearPdnCache) {
    const isProcessEnv = process.env.CLEAN_CACHE === 'true';
    const configSource = isProcessEnv
      ? 'process.env.CLEAN_CACHE'
      : 'clearPdnCache';
    logger.info(`${configSource} is true, clear pdn cache.`);

    modulesCache.clean();
    fs.removeSync(webModulesDir);
    fs.removeSync(tempModulesDir);
  }

  const { deps, enableBabelMacros } = await scanImports(
    userConfig,
    appContext,
    defaultDependencies,
    virtualDependenciesMap,
  );

  const data: DepsMetadata = {
    hash: getDepHash(appDirectory, deps),
    enableBabelMacros,
    map: {},
  };

  let prevData;
  try {
    prevData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {}

  // hash is consistent, no need to re-bundle
  // should ignore optimize deps when SKIP_DEPS_CACHE is falsy
  if (prevData && prevData.hash === data.hash && !ignoreModuleCache) {
    logger.info('Skip dependencies pre-optimization...');
    return;
  }

  if (ignoreModuleCache) {
    const isProcessEnv = process.env.SKIP_DEPS_CACHE === 'true';
    const configSource = isProcessEnv
      ? 'process.env.SKIP_DEPS_CACHE'
      : 'ignoreModuleCache';
    logger.info(`${configSource} is true, pre-optimize dependencies.`);
  }

  [webModulesDir, tempModulesDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.emptyDirSync(dir);
    } else {
      fs.ensureDirSync(dir);
    }
  });

  activeLogger.await(`Start pre-optimizing node_modules...`);

  try {
    await compileDeps(
      appDirectory,
      deps,
      data,
      internalPackages,
      virtualDependenciesMap,
      pdnHost,
    );
  } catch (err) {
    logger.error(`Pre optimize deps error: \n${err as string}`);

    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  const latency = process.hrtime(timer);

  activeLogger.success(
    `Pre-optimize dependencies in ${chalk.yellow(
      `${latency[0] * 1000 + Math.floor(latency[1] / 1e6)}`,
    )} ms.`,
  );
}

export const compileDeps = async (
  appDirectory: string,
  deps: Array<{ specifier: string; importer: string; forceCompile?: boolean }>,
  metaData: DepsMetadata,
  internalPackages: Record<string, string>,
  virtualDependenciesMap: Record<string, string>,
  pdnHost: string,
) => {
  const bundleResult = await await require('esbuild').build({
    entryPoints: deps.map(dep => dep.specifier),
    bundle: true,
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    metafile: true,
    outdir: webModulesDir,
    format: 'esm',
    ignoreAnnotations: true,
    plugins: [
      {
        name: ESBUILD_RESOLVE_PLUGIN_NAME,
        setup(build) {
          build.onResolve({ filter: /^/ }, async args => {
            const {
              kind,
              pluginData: { virtualImporter = appDirectory } = {},
            } = args;

            let { path: specifier } = args;

            if (
              ['import-statement', 'entry-point', 'dynamic-import'].includes(
                kind,
              )
            ) {
              // @@ is alias that point to generated runtime export code
              // so we should mark it as external
              if (specifier.startsWith('@@/')) {
                return { path: specifier, external: true };
              }

              if (specifier.startsWith('/esm/bv/')) {
                const { name } = normalizeSemverSpecifierVersion(specifier);
                specifier = name;
              }

              activeLogger.await(`${chalk.yellow(`compile ${specifier}...`)}`);
              const internalPackageEntryFile =
                internalPackages[specifier] &&
                resolveDepVersion(
                  internalPackages[specifier],
                  appDirectory,
                  virtualDependenciesMap,
                ).filePath;
              const internalPackageEntryDir =
                internalPackageEntryFile &&
                path.dirname(internalPackageEntryFile);
              const importer = internalPackageEntryFile
                ? resolveDepVersion(
                    specifier,
                    internalPackageEntryFile,
                    virtualDependenciesMap,
                  ).filePath
                : virtualImporter;
              const { version, filePath } = resolveDepVersion(
                specifier,
                importer,
                virtualDependenciesMap,
              );

              const cached = modulesCache.get(specifier, version);

              if (cached) {
                return {
                  path: cached.file,
                  namespace: ESBUILD_RESOLVE_PLUGIN_NAME,
                  pluginData: { filePath },
                };
              }

              // download esm file from pdn
              if (
                !deps.find(dep => dep.specifier === specifier)?.forceCompile
              ) {
                const remoteResult = await modulesCache.requestRemoteCache(
                  specifier,
                  version,
                  virtualDependenciesMap,
                  pdnHost,
                );
                if (remoteResult) {
                  return {
                    path: remoteResult.file,
                    namespace: ESBUILD_RESOLVE_PLUGIN_NAME,
                    pluginData: { filePath },
                  };
                }
              }

              // use esmpack transform monorepo packages to esm
              // TODO
              const compiler: Compiler =
                await require('@modern-js/esmpack').esmpack({
                  // should use internal package path as cwd for internal packages
                  cwd: internalPackageEntryDir || appDirectory,
                  outDir: tempModulesDir,
                  env: { NODE_ENV: JSON.stringify('development') },
                });

              const result = await compiler.run({
                specifier,
                importer: virtualImporter,
              });

              if (result.rollupOutput?.output[0].fileName) {
                // ensure monorepo package is written to metadata
                const builtDep = deps.find(dep => dep.specifier === specifier);
                if (builtDep) {
                  builtDep.forceCompile = true;
                }

                return {
                  path: path.join(
                    tempModulesDir,
                    result.rollupOutput?.output[0].fileName,
                  ),
                  namespace: ESBUILD_RESOLVE_PLUGIN_NAME,
                  pluginData: { filePath },
                };
              }
            }
          });

          build.onLoad(
            { filter: /^/, namespace: ESBUILD_RESOLVE_PLUGIN_NAME },
            async args => ({
              contents: await fs.readFile(args.path),
              pluginData: { virtualImporter: args?.pluginData?.filePath },
            }),
          );
        },
      } as ESBuildPlugin,
    ],
  });

  const { outputs } = bundleResult.metafile;

  // match short length key first
  // eg: specifier is 'foo.js', but user import '@bar/node_modules/foo.js' and 'foo.js'
  const keys = Object.keys(outputs).sort((a, b) => a.length - b.length);
  deps.forEach(({ specifier, forceCompile }) => {
    const key = keys.find(key => {
      const { entryPoint } = outputs[key];
      // local compile monorepo packages
      // eg: entryPoint: ../../packages/common-utils/dist/index.js
      if (forceCompile && entryPoint?.endsWith(`${specifier}.js`)) {
        return true;
      }

      if (entryPoint) {
        const parts = entryPoint.split('@');

        parts.pop();

        if (
          parts?.length &&
          pathToUrl(
            parts
              .join('@')
              .replace(
                `${ESBUILD_RESOLVE_PLUGIN_NAME}:${modulesCache.dir}${path.sep}`,
                '',
              ),
          ) === specifier
        ) {
          return true;
        }
      }

      return false;
    });

    if (key) {
      metaData.map[specifier] = pathToUrl(
        path.relative(
          path.resolve(appDirectory, WEB_MODULES_DIR),
          path.resolve(appDirectory, key),
        ),
      );
    } else {
      // TODO: should use lazy warning
      logger.warn(`Can't find ${specifier}.`);
    }
  });
};

export function getDepHash(
  appDirectory: string,
  deps: Array<{ specifier: string; importer: string }>,
): string {
  const content = JSON.stringify(deps.map(dep => dep.specifier));

  return createHash('sha256').update(content).digest('hex').substr(0, 16);
}
