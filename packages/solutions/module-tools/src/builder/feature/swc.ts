import { basename, extname } from 'path';
import type { TransformConfig, JscTarget } from '@modern-js/swc-plugins';
import { Compiler } from '@modern-js/swc-plugins';
import { loaderMap } from '../../constants/loader';
import type { ICompiler, Source, TsTarget, ITsconfig } from '../../types';
import {
  isJsExt,
  isJsLoader,
  isTsExt,
  isTsLoader,
  tsTargetAtOrAboveES2022,
} from '../../utils';

const name = 'swc:transform';
const getSwcTarget = (target: string): JscTarget => {
  // refer to JscTarget
  const list = [
    'es3',
    'es5',
    'es2015',
    'es2016',
    'es2017',
    'es2018',
    'es2019',
    'es2020',
    'es2021',
    'es2022',
  ];
  if (list.includes(target)) {
    return target as JscTarget;
  }

  if (target === 'next') {
    return 'es2022';
  }

  if (target === 'es6') {
    return 'es2015';
  }

  return 'es2022';
};

export const swcTransform = (userTsconfig: ITsconfig) => ({
  name,
  apply(compiler: ICompiler) {
    const tsUseDefineForClassFields =
      userTsconfig?.compilerOptions?.useDefineForClassFields;
    const emitDecoratorMetadata =
      userTsconfig?.compilerOptions?.emitDecoratorMetadata ?? false;

    // https://www.typescriptlang.org/tsconfig#useDefineForClassFields
    let useDefineForClassFields: boolean;
    let tsTarget = userTsconfig?.compilerOptions?.target;

    tsTarget = tsTarget ? (tsTarget.toLowerCase() as TsTarget) : undefined;
    if (tsUseDefineForClassFields !== undefined) {
      useDefineForClassFields = tsUseDefineForClassFields;
    } else if (tsTarget !== undefined) {
      useDefineForClassFields = tsTargetAtOrAboveES2022(tsTarget);
    } else {
      useDefineForClassFields = true;
    }

    const {
      transformImport,
      transformLodash,
      externalHelpers,
      loader: userLoader,
    } = compiler.config;

    compiler.hooks.transform.tapPromise(
      { name },
      async (source): Promise<Source> => {
        const { path } = source;
        // Todo: emitDecoratorMetadata default value
        const isTs = isTsLoader(source.loader) || isTsExt(path);
        const ext = extname(path);
        const loader = source.loader ?? userLoader[ext] ?? loaderMap[ext];
        const enableJsx = loader === 'tsx' || loader === 'jsx';

        if (isJsExt(path) || isJsLoader(source.loader)) {
          const { target, jsx } = compiler.config;

          const swcCompilerOptions: TransformConfig = {
            sourceMaps: Boolean(compiler.config.sourceMap),
            inputSourceMap: false,
            swcrc: false,
            configFile: false,
            jsc: {
              parser: isTs
                ? {
                    syntax: 'typescript',
                    tsx: enableJsx,
                    decorators: true,
                  }
                : {
                    syntax: 'ecmascript',
                    jsx: enableJsx,
                    decorators: true,
                  },
              transform: {
                react: {
                  runtime: jsx === 'transform' ? 'classic' : 'automatic',
                },
                useDefineForClassFields,
                legacyDecorator: emitDecoratorMetadata ? true : undefined,
                decoratorMetadata: emitDecoratorMetadata ? true : undefined,
              },
              externalHelpers,
              target: getSwcTarget(target),
            },
            isModule: 'unknown',
            extensions: {
              pluginImport: transformImport,
              lodash: transformLodash
                ? {
                    cwd: compiler.context.root,
                    ids: ['lodash', 'lodash-es'],
                  }
                : undefined,
            },
          };

          const swcCompiler = new Compiler(swcCompilerOptions);
          const result = await swcCompiler.transform(
            basename(path),
            source.code,
          );
          return {
            ...source,
            code: result.code,
            map:
              typeof result.map === 'string'
                ? JSON.parse(result.map)
                : result.map,
          };
        }
        return source;
      },
    );
  },
});

const JS_REGEX = /\.(?:js|mjs|cjs)$/;

export const swcRenderChunk = {
  name: 'swc:renderChunk',
  apply(compiler: ICompiler) {
    compiler.hooks.renderChunk.tapPromise(
      { name: 'swc:renderChunk' },
      async chunk => {
        if (JS_REGEX.test(chunk.fileName) && chunk.type === 'chunk') {
          const { umdModuleName, format } = compiler.config;
          const name =
            typeof umdModuleName === 'function'
              ? umdModuleName(chunk.fileName)
              : umdModuleName;
          const swcCompiler = new Compiler({
            sourceMaps: Boolean(compiler.config.sourceMap),
            inputSourceMap: false,
            swcrc: false,
            configFile: false,
            extensions: {},
            jsc: {
              target: getSwcTarget(compiler.config.target),
              parser: { syntax: 'ecmascript' },
            },
            module:
              format === 'umd'
                ? {
                    type: 'umd',
                  }
                : undefined,
            // If `chunk.contents` is recognized as [Script](https://swc.rs/docs/configuration/compilation#ismodule),
            // then it will not be converted to umd format content.
            // so we need to set `isModule` to `true`.
            // eg: when `autoExternal` is false, then chunk.contents will be recognized as [Script]
            isModule: format === 'umd' ? true : 'unknown',
          });
          const result = await swcCompiler.transform(
            name,
            chunk.contents.toString(),
          );
          return {
            ...chunk,
            contents: result.code,
            map:
              typeof result.map === 'string'
                ? JSON.parse(result.map)
                : result.map,
          };
        }
        return chunk;
      },
    );
  },
};
