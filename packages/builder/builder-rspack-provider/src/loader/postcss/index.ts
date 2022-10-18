import { Processor } from 'postcss';
import { getCompiledPath } from '../../shared';

const MODULE_REGEXP = /.*\.module\.(s(c|a)|c|le)ss$/;

const judgeCssModules = (modules: any, resourcePath: string): boolean => {
  if (typeof modules === 'boolean') {
    return modules;
  } else if (typeof modules === 'object') {
    if (modules.auto === false) {
      return true;
    } else {
      return MODULE_REGEXP.test(resourcePath);
    }
  } else {
    return false;
  }
};

export default async function postcssLoader(loaderContext: any) {
  let options = loaderContext.getOptions() ?? {};

  try {
    let meta = '';
    let plugins = options.postcssOptions.plugins || [];

    if (judgeCssModules(options.modules, loaderContext.resourcePath)) {
      plugins.push(require(getCompiledPath('postcss-modules'))({
        getJSON: function (_: string, json: string) {
          if (json) {
            meta = json;
          }
        }
      }));
    }

    let root = new Processor(plugins);
    let res = await root.process(loaderContext.source.getCode(), {
      from: undefined,
    });
    return {
      content: res.css,
      meta: meta ? Buffer.from(JSON.stringify(meta)) : '',
    };
  } catch (err) {
    throw err;
  }
}
