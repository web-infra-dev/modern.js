import fs from 'fs-extra';
import path from 'path';
import pm from 'picomatch';
import { Loader, Plugin, BuildResult } from 'esbuild';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import { ILibuilder, BuildConfig } from '../types';
import { installResolve } from './resolve';
import { normalizeSourceMap } from '../utils';
import { DATAURL_JAVASCRIPT_PATTERNS } from '../constants/regExp';
import { loaderMap } from '../constants/loader';

type IEntry = {
  /**
   * Entry name
   */
  name: string;
  /**
   * Entry path
   */
  path: string;
  /**
   * Chunks name.
   */
  chunkNames: string[];
};

/**
 * This is a hack to deal with the inconsit behavior between rollup and esbuild
 * rollup resolveId support return non absolute path
 * esbuild onResolve doesn't support return no absolute path for non file namespace
 * so we need to convert rollup's resolve result to non file namespace to avoid esbuild crash
 * and support rollup's plugin's virtual module
 * @example
 * rollup's plugin
 * {
 *   resolveId(id){
 *     if(id === 'virtual-path'){
 *         return id; // this will crash esbuild
 *     }
 *   }
 * }
 * convert it to esubild plugin
 * {
 *   setup(build){
 *      build.onResolve({filter:/.*\/},args => {
 *         if(args.path === 'virtual-path'){
 *             return {
 *                path: id,
 *                namespace: VirtualPathProxyNamespace
 *             }
 *         }
 *    })
 *   }
 * }
 */
const VirtualPathProxyNamespace = 'VirtualPathProxyNamespace';
/**
 * some plugin may return virtualModuleId from onResolve, which will cause problem for other plugin
 * which may treat id as real fileSystemPath, wo wee need to convert it to other namspece
 */
const LibuildVirtualNamespace = 'libuild:virtual';
/**
 * esbuld's external will keep import statement as import|require statement, which
 * is ok for node environment but will cause problem for browser environment(lack of commonjs runtime supports)
 * so we need to support features like rollup's globals, which will convert an module id to global variable
 * @example
 * @libuild.config.ts
 * {
 *   externals: {
 *   'jquery': '$'
 *   }
 * }
 * which will convert this code
 * import jq from 'jquery'
 * to
 * const jq = globalThis['$']
 */
const LibuildGlobalNamespace = 'libuild:globals';

async function internalLoad(id: string) {
  return fs.promises.readFile(id);
}

/**
 * proxy libuild hooks to esbuild
 */
export const adapterPlugin = (compiler: ILibuilder): Plugin => {
  return {
    name: 'libuild:adapter',
    setup(build) {
      build.onStart(async () => {
        compiler.config.logger.debug('onStart');
        compiler.resolve = installResolve(compiler);
        compiler.outputChunk = new Map();
        await compiler.hooks.startCompilation.promise();
      });
      build.onResolve({ filter: /.*/ }, async (args) => {
        compiler.config.logger.debug('onResolve', args.path);

        const { query } = resolvePathAndQuery(args.path);
        if (query.virtual) {
          return {
            path: args.path,
            namespace: LibuildVirtualNamespace,
          };
        }
        /**
         * isolate plugin between libuild and other namespace
         */
        if (
          args.namespace !== 'file' &&
          args.namespace !== VirtualPathProxyNamespace &&
          args.namespace !== LibuildVirtualNamespace
        ) {
          return;
        }
        if (args.kind === 'url-token') {
          return {
            path: args.path,
            external: true,
          };
        }
        for (const [key] of Object.entries(compiler.config.globals)) {
          const isMatch = pm(key);
          if (isMatch(args.path)) {
            return {
              path: args.path,
              namespace: LibuildGlobalNamespace,
            };
          }
        }
        /**
         * The node: protocol was added to require in Node v14.18.0
         * https://nodejs.org/api/esm.html#node-imports
         */
        if (/^node:/.test(args.path)) {
          return {
            path: args.path.slice(5),
            external: true,
          };
        }
        const result = await compiler.hooks.resolve.promise(args);

        if (
          result?.path &&
          !path.isAbsolute(result.path) &&
          !result.external &&
          !DATAURL_JAVASCRIPT_PATTERNS.test(result.path)
        ) {
          return {
            path: result.path,
            namespace: VirtualPathProxyNamespace,
          };
        }
        // esbuild cant handle return non absolute path from plugin, so we need to do a trick to handle this
        // see https://github.com/evanw/esbuild/issues/2404
        if (DATAURL_JAVASCRIPT_PATTERNS.test(args.path)) {
          return {
            path: args.path,
            namespace: 'dataurl',
          };
        }

        if (result != null) {
          return result;
        }
      });
      build.onLoad({ filter: /.*/ }, async (args) => {
        compiler.config.logger.debug('onLoad', args.path);

        if (args.namespace === LibuildGlobalNamespace) {
          const value = compiler.config.globals[args.path];
          return {
            contents: `module.exports = (typeof globalThis !== "undefined" ? globalThis : Function('return this')() || global || self)[${JSON.stringify(
              value
            )}]`,
          };
        }
        if (args.suffix) {
          args.path += args.suffix;
        }
        if (
          args.namespace !== 'file' &&
          args.namespace !== VirtualPathProxyNamespace &&
          args.namespace !== LibuildVirtualNamespace
        ) {
          return;
        }

        let result = await compiler.hooks.load.promise(args);
        if (result == null) {
          // let esbuild to handle data:text/javascript
          if (DATAURL_JAVASCRIPT_PATTERNS.test(args.path)) {
            return;
          }
          result = {
            contents: await internalLoad(args.path),
          };
        }

        // file don't need transform when loader is copy
        if (!result.contents || result.loader === 'copy') {
          return result;
        }

        const { originalFilePath } = resolvePathAndQuery(args.path);

        if (originalFilePath) {
          compiler.addWatchFile(originalFilePath);
        }

        const context = compiler.getTransformContext(args.path);

        context.addSourceMap(context.genPluginId('adapter'), result.map);

        const transformResult = await compiler.hooks.transform.promise({
          code: result.contents.toString(),
          path: args.path,
          loader: result.loader,
        });
        const ext = path.extname(args.path);
        const loader = (transformResult.loader ?? compiler.config.loader[ext] ?? loaderMap[ext]) as Loader;
        const inlineSourceMap = context.getInlineSourceMap();

        return {
          contents: transformResult.code + inlineSourceMap,
          loader,
          resolveDir:
            result.resolveDir ??
            (args.namespace === VirtualPathProxyNamespace ? compiler.config.root : path.dirname(args.path)),
        };
      });
      build.onEnd(async (result) => {
        compiler.config.logger.debug('onEnd');
        if (result.errors.length) {
          return;
        }

        addCssEntryPoint(result);

        const entryPoints = Object.values(build.initialOptions.entryPoints!).map((i) =>
          normalizeEntryPoint(i, compiler.config.root)
        );

        await normalizeOutput(compiler, result, entryPoints);

        for (const [key, value] of compiler.outputChunk.entries()) {
          const context = compiler.getSourcemapContext(value.fileName);
          if (value.type === 'chunk' && compiler.config.sourceMap) {
            context.addSourceMap(context.genPluginId('adapter'), value.map);
          }
          const processedResult = await compiler.hooks.processAsset.promise(value);
          if (processedResult.type === 'chunk' && compiler.config.sourceMap) {
            processedResult.map = context.getSourceMap();
          }
          compiler.outputChunk.set(key, processedResult);
        }

        const manifest = {
          type: 'esbuild' as const,
          metafile: result.metafile!,
          config: build.initialOptions,
        };

        await compiler.hooks.processAssets.promise(compiler.outputChunk, manifest);
        await compiler.hooks.endCompilation.promise(compiler.getErrors());
      });
    },
  };
};

export function findEntry(paths: string[], otherPaths: string) {
  paths = paths.sort((a, b) => a.length - b.length);
  let max = 0;
  let value = null;
  for (const path of paths) {
    for (let i = 0; i < Math.min(path.length, otherPaths.length); i++) {
      if (path.charAt(i) !== otherPaths.charAt(i)) {
        if (i > max) {
          max = i;
          value = path;
        }
        break;
      }
    }
  }
  return value;
}

async function normalizeOutput(compiler: ILibuilder, result: BuildResult, entryPoints: string[]) {
  const { outputs } = result.metafile!;
  const { root } = compiler.config;
  const needSourceMap = Boolean(compiler.config.sourceMap);
  const entries: Record<string, IEntry> = {};
  for (const [key, value] of Object.entries(outputs)) {
    if (key.endsWith('.map')) {
      continue;
    }
    const absPath = path.resolve(root, key);
    const item = result.outputFiles?.find((x) => x.path === absPath);
    const mapping = result.outputFiles?.find(
      (x) => x.path.endsWith('.map') && x.path.replace(/\.map$/, '') === absPath
    );
    if (!item) {
      throw new Error(`no contents for ${absPath}`);
    }
    let { entryPoint } = value;
    if (absPath.endsWith('.js')) {
      const isEntry = isEntryPoint(entryPoints, root, entryPoint);
      compiler.emitAsset(absPath, {
        type: 'chunk',
        contents: item.text,
        map: normalizeSourceMap(mapping?.text, { needSourceMap }),
        entryPoint: entryPoint ? normalizeEntryPoint(entryPoint, root) : undefined,
        fileName: absPath,
        isEntry,
      });
      if (isEntry) {
        entryPoint = normalizeEntryPoint(entryPoint!, root);
        entries[entryPoint] = {
          name: normalizeEntryName(entryPoint, compiler.config.input),
          path: entryPoint,
          chunkNames: [absPath],
        };
      }
    } else {
      compiler.emitAsset(absPath, {
        type: 'asset',
        contents: Buffer.from(item.contents),
        entryPoint: entryPoint ? normalizeEntryPoint(entryPoint, root) : undefined,
        fileName: absPath,
      });
    }
  }
}

function normalizeEntryPoint(entryPoint: string, root: string) {
  if (entryPoint.startsWith(root)) {
    return entryPoint;
  }
  if (entryPoint.startsWith(LibuildVirtualNamespace)) {
    const value = entryPoint.replace(`${LibuildVirtualNamespace}:`, '');
    if (value.startsWith(root)) {
      return value;
    }
    return path.join(root, value);
  }
  if (fs.existsSync(path.join(root, entryPoint))) {
    return path.join(root, entryPoint);
  }
  return path.join(root, entryPoint);
}

function isEntryPoint(entryPoints: string[], root: string, entryPoint?: string): boolean {
  return !!(entryPoint && entryPoints.includes(normalizeEntryPoint(entryPoint, root)));
}

// fix css has no entryPoints
function addCssEntryPoint(result: BuildResult) {
  const { outputs } = result.metafile!;
  const outputJsPaths = Object.keys(outputs).filter((x) => x.endsWith('.js'));
  for (const [key, value] of Object.entries(outputs)) {
    if (key.endsWith('.css') && !value.entryPoint) {
      const jsPath = findEntry(outputJsPaths, key);
      const item = outputs[jsPath!];
      value.entryPoint = item.entryPoint;
    }
  }
}

function normalizeEntryName(entryPath: string, inputs: BuildConfig['input']): string {
  const { query } = resolvePathAndQuery(entryPath);
  for (const [entryName, entry] of Object.entries(inputs)) {
    if (typeof entry === 'string' && entry === entryPath) {
      return entryName;
    }
  }
  return query.name as string;
}
