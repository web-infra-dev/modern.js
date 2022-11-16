import { Processor } from 'postcss';
import { Buffer } from 'buffer';
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
  const options = loaderContext.getOptions() ?? {};

  let meta = '';
  const plugins = [...(options.postcssOptions.plugins || [])];

  if (judgeCssModules(options.modules, loaderContext.resourcePath)) {
    plugins.push(
      require(getCompiledPath('postcss-modules'))({
        getJSON(_: string, json: string) {
          if (json) {
            meta = json;
          }
        },
      }),
    );
  }

  const root = new Processor(plugins);
  const res = await root.process(loaderContext.source.getCode(), {
    from: undefined,
  });
  return {
    content: res.css,
    meta: meta ? Buffer.from(JSON.stringify(meta)) : '',
  };
}
