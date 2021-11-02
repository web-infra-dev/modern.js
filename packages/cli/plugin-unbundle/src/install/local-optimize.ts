import { createHash } from 'crypto';
import path from 'path';
import { chalk, fs } from '@modern-js/utils';
import logger, { Signale } from 'signale';
import enhancedResolve from 'enhanced-resolve';
import { Plugin as ESBuildPlugin } from 'esbuild';
import type { Compiler } from '@modern-js/esmpack';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  WEB_MODULES_DIR,
  GLOBAL_CACHE_DIR_NAME,
  TEMP_MODULES_DIR,
  META_DATA_FILE_NAME,
  ESBUILD_RESOLVE_PLUGIN_NAME,
  VIRTUAL_DEPS_MAP,
  MODERN_JS_INTERNAL_PACKAGES,
} from '../constants';
import { findPackageJson, pathToUrl } from '../utils';
import { scanImports } from './scan-imports';
import { ModulesCache, normalizeSemverSpecifierVersion } from './modules-cache';

const resolve = enhancedResolve.create.sync({
  conditionNames: ['import', 'module', 'development', 'browser'],
  mainFields: ['browser', 'module', 'main'],
});

// init global local modules cache
const modulesCache = new ModulesCache(GLOBAL_CACHE_DIR_NAME);

// force ignore deps cache
const SKIP_DEPS_CACHE = process.env.SKIP_DEPS_CACHE === 'true';

// local web_modules dir， bundled by esbuild
let webModulesDir: string;

// temp esm modules like node_modules
let tempModulesDir: string;

// const debug = createDebugger(`esm:local-optimize`);

const activeLogger = new Signale({ interactive: true, scope: 'optimize-deps' });

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
): { version: string; filePath: string | null } => {
  const cached = resolvedDepsMap.get(`${dep}${importer}`);

  if (cached) {
    return cached;
  }

  let version = 'latest';
  let filePath = null;

  if (!VIRTUAL_DEPS_MAP[dep]) {
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

export async function optimizeDeps(
  userConfig: NormalizedConfig,
  appContext: IAppContext,
) {
  const timer = process.hrtime();

  const { appDirectory } = appContext;

  webModulesDir = path.resolve(appDirectory, WEB_MODULES_DIR);

  tempModulesDir = path.resolve(appDirectory, TEMP_MODULES_DIR);

  const dataPath = path.join(webModulesDir, META_DATA_FILE_NAME);

  // should clean gloabl modules cache and local cache
  if (process.env.CLEAN_CACHE === 'true') {
    modulesCache.clean();
    fs.removeSync(webModulesDir);
    fs.removeSync(tempModulesDir);
  }

  const { deps, enableBabelMacros } = await scanImports(userConfig, appContext);

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
  if (prevData && prevData.hash === data.hash && !SKIP_DEPS_CACHE) {
    logger.info('Skip dependencies pre-optimization...');
    return;
  }

  if (SKIP_DEPS_CACHE) {
    logger.info(`SKIP_DEPS_CACHE is true, pre-optimize dependencies.`);
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
    await compileDeps(appDirectory, deps, data);
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

const compileDeps = async (
  appDirectory: string,
  deps: Array<{ specifier: string; importer: string; forceCompile?: boolean }>,
  metaData: DepsMetadata,
) => {
  const bundleResult = await await require('esbuild').build({
    entryPoints: deps.map(dep => dep.specifier),
    bundle: true,
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    metafile: true,
    outdir: webModulesDir,
    format: 'esm',
    treeShaking: 'ignore-annotations',
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
              const { version, filePath } = resolveDepVersion(
                specifier,
                MODERN_JS_INTERNAL_PACKAGES[specifier]
                  ? resolveDepVersion(
                      specifier,
                      resolveDepVersion(
                        MODERN_JS_INTERNAL_PACKAGES[specifier],
                        appDirectory,
                      ).filePath,
                    ).filePath
                  : virtualImporter,
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
                  cwd: appDirectory,
                  outDir: tempModulesDir,
                  env: { NODE_ENV: JSON.stringify('development') },
                });

              const result = await compiler.run({
                specifier,
                importer: virtualImporter,
              });

              if (result.rollupOutput?.output[0].fileName) {
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

  deps.forEach(({ specifier, forceCompile }) => {
    const key = Object.keys(outputs).find(key => {
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
