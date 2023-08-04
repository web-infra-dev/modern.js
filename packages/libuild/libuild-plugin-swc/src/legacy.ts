import type { LibuildPlugin } from '@modern-js/libuild';
import { Compiler, TransformConfig } from '@modern-js/swc-plugins';
import { isJsExt, resolvePathAndQuery, isJsLoader, deepMerge, isTsExt, isTsLoader } from '@modern-js/libuild-utils';

/** @deprecated  */
export const transformPlugin = (options?: TransformConfig): LibuildPlugin => {
  const pluginName = 'libuild:swc-transform-legacy';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.transform.tapPromise({ name: pluginName }, async (args) => {
        const { originalFilePath } = resolvePathAndQuery(args.path);
        const isTs = isTsExt(originalFilePath) || isTsLoader(args.loader);
        if (isJsExt(originalFilePath) || isJsLoader(args.loader)) {
          const mergeOptions: TransformConfig = deepMerge(
            {
              filename: originalFilePath,
              sourceMaps: Boolean(compiler.config.sourceMap),
              inputSourceMap: false,
              swcrc: false,
              configFile: false,
              jsc: {
                parser: isTs
                  ? {
                      syntax: 'typescript',
                      tsx: true,
                      decorators: true,
                    }
                  : {
                      syntax: 'ecmascript',
                      jsx: true,
                      decorators: true,
                    },
                target: 'es2022',
              },
              isModule: 'unknown',
              extensions: {},
            },
            options || {}
          );
          const swcCompiler = new Compiler(mergeOptions);
          const result = await swcCompiler.transformSync(originalFilePath, args.code);
          return {
            ...args,
            code: result.code,
            map: typeof result.map === 'string' ? JSON.parse(result.map) : result.map,
          };
        }
        return args;
      });
    },
  };
};
