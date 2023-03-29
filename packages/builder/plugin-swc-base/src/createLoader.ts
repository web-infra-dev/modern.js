import { getBrowserslist, lodash as _ } from '@modern-js/utils';
import type { LoaderContext, LoaderDefinitionFunction } from 'webpack';
import type { ICompiler, CompilerInstance, TransformConfig } from './types';

export function createLoader<CompilerShape extends ICompiler>(
  Compiler: CompilerShape,
): LoaderDefinitionFunction {
  const compilers = new Map<Record<string, any>, CompilerInstance>();

  function getCompiler(options: Record<string, any>) {
    for (const [opts, compiler] of compilers.entries()) {
      if (_.eq(opts, options)) {
        return compiler;
      }
    }

    const compiler = new Compiler(options);
    compilers.set(options, compiler);
    return compiler;
  }

  return function SwcLoader(code, map) {
    const resolve = this.async();
    const filename = this.resourcePath;

    const options = this.getOptions();
    normalizeLoaderOption(options, this);
    const compiler = getCompiler(options);
    compiler
      .transform(
        filename,
        code,
        typeof map === 'object' ? JSON.stringify(map) : map,
      )
      .then(result => {
        resolve(null, result.code, result.map);
      })
      .catch(err => {
        resolve(err as Error);
      });
  };
}

type SwcOptions = any;

function setReactDevMode(
  swc: SwcOptions,
  mode: 'development' | 'production' | 'none',
) {
  if (!swc.jsc) {
    swc.jsc = {};
  }
  if (!swc.jsc.transform) {
    swc.jsc.transform = {};
  }
  if (!swc.jsc.transform.react) {
    swc.jsc.transform.react = {};
  }

  const { react } = swc.jsc.transform;
  react.development = react.development ?? mode === 'development';
  react.refresh = react.refresh ?? mode === 'development';
}

export function normalizeLoaderOption(
  options: TransformConfig,
  ctx: LoaderContext<TransformConfig>,
) {
  const enableSourceMap = ctx.sourceMap;

  if (enableSourceMap) {
    options.sourceMaps = true;
  }

  if (options.env && !options.env.targets) {
    options.env.targets = getBrowserslist(options.cwd || process.cwd());
  }

  if (
    !options.jsc?.transform?.react ||
    options.jsc.transform.react.development === undefined
  ) {
    setReactDevMode(options, ctx.mode);
  }

  // disable unnecessary config searching
  // all config should be explicitly set
  options.swcrc = false;
}
