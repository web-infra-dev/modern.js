import { Options, TransformConfig } from '@modern-js/swc-plugins';
import { getBrowserslist } from '@modern-js/utils';
import type { LoaderContext } from 'webpack';
import { Compiler } from './binding';

export function createLoader() {
  let compiler: Compiler | null = null;

  return async function SwcLoader(
    this: LoaderContext<TransformConfig>,
    code: string,
    map?: string,
  ) {
    const resolve = this.async();
    const filename = this.resourcePath;

    if (!compiler) {
      // Only first transform will run following code
      const options = this.getOptions();
      normalizeLoaderOption(options, this);
      compiler = new Compiler(options);
    }

    try {
      const result = await compiler.transform(filename, code, map);
      resolve(null, result.code, result.map?.toString());
    } catch (err) {
      resolve(err as Error);
    }
  };
}

export default createLoader();

function setReactDevMode(
  swc: Options,
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

  swc.jsc.transform.react.development = mode === 'development';
  swc.jsc.transform.react.refresh = mode === 'development';
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
