import { extname } from 'path';
import type { SourceMapConsumer } from 'source-map';
import sourceMapSupport from 'source-map-support';
import { transformSync, TransformOptions, Message } from 'esbuild';
import { addHook } from 'pirates';
import fs from 'fs';
import module from 'module';
import process from 'process';

type COMPILE = (code: string, filename: string) => string;

export interface TransformData {
  filePath: string;
  fileContent: string;
  warnings: Message[];
  rawSourceMap: string;
  sourceMap?: SourceMapConsumer;
}

export const transformData = new Map<string, TransformData>();

function installSourceMapSupport() {
  if ((process as any).setSourceMapsEnabled) {
    (process as any).setSourceMapsEnabled(true);
  } else {
    sourceMapSupport.install({
      handleUncaughtExceptions: false,
      environment: 'node',
      retrieveSourceMap(file) {
        if (transformData.has(file)) {
          return {
            url: file,
            map: transformData.get(file)!.rawSourceMap,
          };
        }
        return null;
      },
    });
  }
}

/**
 * Patch the Node CJS loader to suppress the ESM error
 *
 * @link https://github.com/nodejs/node/blob/069b5df/lib/internal/modules/cjs/loader.js#L1125
 * @link https://github.com/standard-things/esm/issues/868#issuecomment-594480715
 */
function patchCommonJsLoader(compile: COMPILE) {
  // @ts-expect-error
  const extensions = module.Module._extensions;
  const jsHandler = extensions['.js'];

  extensions['.js'] = function (module: any, filename: string) {
    try {
      return jsHandler.call(this, module, filename);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUIRE_ESM') {
        throw error;
      }

      let content = fs.readFileSync(filename, 'utf8');
      content = compile(content, filename);
      module._compile(content, filename);
    }
  };
}

type SuffixStar<S extends string> = `.${S}`;
type LOADERS = 'js' | 'ts';
type EXTENSIONS = SuffixStar<LOADERS>;

const FILE_LOADERS = {
  '.js': 'js',
  '.ts': 'ts',
} as const;
const DEFAULT_EXTENSIONS = Object.keys(FILE_LOADERS);
const getLoader = (filename: string): LOADERS => FILE_LOADERS[extname(filename) as EXTENSIONS];

interface RegisterOptions extends TransformOptions {
  extensions?: EXTENSIONS[];
  /**
   * Auto-ignore node_modules. Independent of any matcher.
   * @default true
   */
  hookIgnoreNodeModules?: boolean;
  /**
   * A matcher function, will be called with path to a file. Should return truthy if the file should be hooked, falsy otherwise.
   */
  hookMatcher?(fileName: string): boolean;
}

export function register(esbuildOptions: RegisterOptions = {}) {
  const { extensions = DEFAULT_EXTENSIONS, hookIgnoreNodeModules = true, hookMatcher, ...overrides } = esbuildOptions;
  const compile: COMPILE = function compile(code, filename) {
    const {
      code: js,
      warnings,
      map: jsSourceMap,
    } = transformSync(code, {
      logLevel: 'silent',
      sourcefile: filename,
      sourcemap: true,
      loader: getLoader(filename),
      // TODO: whether to change to 'esm'
      format: 'cjs',
      ...overrides,
    });

    const data: TransformData = {
      filePath: filename,
      fileContent: code,
      warnings,
      rawSourceMap: jsSourceMap,
    };

    transformData.set(filename, data);

    return js;
  };
  const revert = addHook(compile, {
    exts: extensions,
    ignoreNodeModules: hookIgnoreNodeModules,
    matcher: hookMatcher,
  });

  installSourceMapSupport();
  patchCommonJsLoader(compile);

  return {
    unregister() {
      revert();
      transformData.clear();
    },
  };
}
