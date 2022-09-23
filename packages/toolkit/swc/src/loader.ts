import { TransformConfig } from '@modern-js/swc-plugins';
import { getBrowserslist } from '@modern-js/webpack-builder';
import { Options } from '@swc/core';
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
      // eslint-disable-next-line no-multi-assign
      const swc = (options.swc = options.swc || {});

      const enableSourceMap = this.sourceMap;

      if (enableSourceMap) {
        swc.sourceMaps = true;
      }

      if (swc.env && !swc.env.targets) {
        swc.env.targets = await getBrowserslist(swc.cwd || process.cwd());
      }

      if (
        !swc.jsc?.transform?.react ||
        swc.jsc.transform.react.development === undefined
      ) {
        setReactDevMode(swc, this.mode);
      }

      // disable unneccessary config searching
      // all config should be explitly set
      swc.swcrc = false;

      compiler = new Compiler(options);
    }
    const result = await compiler.transform(filename, code, map);
    resolve(null, result.code, result.map?.toString());

    // try {
    //   if (deoptimize) {
    //     // Using of plugin-import results in napi call JsFunction, result in bad perf
    //     const result = compiler.transformSync(filename, code, map);
    //     resolve(null, result.code, result.map?.toString());
    //   } else {
    //     const result = await compiler.transform(filename, code, map);
    //     resolve(null, result.code, result.map?.toString());
    //   }
    // } catch (e) {
    //   resolve(e as Error);
    // }
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
}

// check if js function is needed
// function shouldDeoptimize(config: TransformConfig): boolean {
//   let hasJsFunction = false;

//   if (config.extensions?.pluginImport) {
//     if (
//       config.extensions.pluginImport.some(it => {
//         return it.replaceJs?.replaceExpr || it.replaceCss?.replaceExpr;
//       })
//     ) {
//       hasJsFunction = true;
//     }
//   }
//   return hasJsFunction;
// }
