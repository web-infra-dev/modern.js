import { deepMerge } from '@modern-js/libuild-utils';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';
import path from 'path';
import { DEFAULT_NODE_ENV } from '../../constants/config';
import { ILibuilder, PostcssOptions, Style } from '../../types';
import { postcssUrlPlugin } from './postcssUrlPlugin';
import { getHash } from './utils';

async function loadPostcssConfig(root: string, postcssOptions: Style['postcss']): Promise<PostcssOptions> {
  let resolvedPostcssConfig: postcssrc.Result | null = null;
  const options = postcssOptions ?? {};
  try {
    resolvedPostcssConfig = await postcssrc(
      {
        env: process.env.NODE_ENV || DEFAULT_NODE_ENV,
      },
      root
    );
  } catch (e) {
    if (!/No PostCSS Config found/.test((e as Error)?.message)) {
      throw e;
    }
    resolvedPostcssConfig = null;
  }
  if (resolvedPostcssConfig) {
    return deepMerge(
      {
        processOptions: resolvedPostcssConfig.options,
        plugins: resolvedPostcssConfig.plugins,
      },
      options
    );
  }
  return options;
}
const cssLangs = `\\.(css|less|sass|scss)($|\\?)`;
const cssModuleRE = new RegExp(`\\.module${cssLangs}`);

export const isCssModule = (filePath: string, autoModules: boolean | RegExp) => {
  return typeof autoModules === 'boolean' ? autoModules && cssModuleRE.test(filePath) : autoModules.test(filePath);
};

export const postcssTransformer = async (
  css: string,
  entryPath: string,
  compilation: ILibuilder
): Promise<{
  code: string;
  loader: 'js' | 'css';
}> => {
  const postcssConfig = await loadPostcssConfig(compilation.config.root, compilation.config.style.postcss);
  const { plugins = [], processOptions = {} } = postcssConfig;
  const { modules: modulesOption = {}, autoModules = true } = compilation.config.style;
  const { getJSON: userGetJSON } = modulesOption;
  let modules: Record<string, string> = {};
  const finalPlugins = [
    postcssUrlPlugin({
      entryPath,
      compilation,
    }),
    ...plugins,
  ];
  if (isCssModule(entryPath, autoModules)) {
    finalPlugins.push(
      (await import('postcss-modules')).default({
        generateScopedName(name: string, filename: string, css: string) {
          const hash = getHash(filename, 'utf-8').substring(0, 5);
          return `${name}_${hash}`;
        },
        async resolve(id: string) {
          return id;
        },
        ...modulesOption,
        getJSON(cssFileName: string, _modules: Record<string, string>, outputFileName: string) {
          if (userGetJSON) {
            userGetJSON(cssFileName, _modules, outputFileName);
          }
          modules = _modules;
        },
      })
    );
  }
  let loader: 'js' | 'css' = 'css';
  let { css: code } = await postcss(finalPlugins).process(css, {
    from: entryPath,
    ...processOptions,
  });
  if (Object.values(modules).length) {
    // add hash query for same path, let esbuild cache invalid
    compilation.virtualModule.set(entryPath, code);
    const doubleBackslashesPath = entryPath.replace(/\\/g, '\\\\');
    code = `import "${doubleBackslashesPath}?css_virtual&hash=${getHash(
      code,
      'utf-8'
    )}";export default ${JSON.stringify(modules)}`;
    loader = 'js';
  }

  return {
    code,
    loader,
  };
};
