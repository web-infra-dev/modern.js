import { getBrowserslist } from '@modern-js/utils';
import type { LoaderContext, LoaderDefinitionFunction } from 'webpack';
import { Options as SwcOptions } from '@modern-js/swc-plugins';
import { Compiler } from './binding';
import { TransformConfig } from './types';

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

function normalizeLoaderOption(
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

export function createLoader(): LoaderDefinitionFunction {
  const compilers = new Map<Record<string, any>, Compiler>();

  function getCompiler(options: Required<TransformConfig>) {
    if (compilers.has(options)) {
      return compilers.get(options)!;
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
    const compiler = getCompiler(options as Required<TransformConfig>);
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

export default createLoader();
