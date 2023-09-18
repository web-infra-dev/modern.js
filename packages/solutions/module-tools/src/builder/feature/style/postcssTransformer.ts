import { basename, extname } from 'path';
import postcss from 'postcss';
import { ICompiler } from '../../../types';
import { getHash } from '../../../utils';
import { postcssUrlPlugin } from './postcssUrlPlugin';

const cssLangs = `\\.(css|less|sass|scss)($|\\?)`;
const cssModuleRE = new RegExp(`\\.module${cssLangs}`);

export const isCssModule = (
  filePath: string,
  autoModules: boolean | RegExp,
) => {
  return typeof autoModules === 'boolean'
    ? autoModules && cssModuleRE.test(filePath)
    : autoModules.test(filePath);
};

export const postcssTransformer = async (
  css: string,
  entryPath: string,
  compilation: ICompiler,
): Promise<{
  code: string;
  loader: 'js' | 'css';
}> => {
  const postcssConfig = compilation.config.style.postcss;
  const { plugins = [], processOptions = {} } = postcssConfig;
  const { modules: modulesOption = {}, autoModules = true } =
    compilation.config.style;
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
        generateScopedName(name: string, filename: string, _css: string) {
          const hash = getHash(filename, 'utf-8').substring(0, 5);
          return `${name}_${hash}`;
        },
        async resolve(id: string) {
          return id;
        },
        ...modulesOption,
        getJSON(
          cssFileName: string,
          _modules: Record<string, string>,
          outputFileName: string,
        ) {
          if (userGetJSON) {
            userGetJSON(cssFileName, _modules, outputFileName);
          }
          modules = _modules;
        },
      }),
    );
  }
  let loader: 'js' | 'css' = 'css';
  let { css: code } = await postcss(finalPlugins).process(css, {
    from: entryPath,
    ...processOptions,
  });
  if (Object.values(modules).length) {
    // use hash to to set virtual module key
    const hash = getHash(code, 'utf-8').substring(0, 8);
    const replacedName = basename(entryPath, extname(entryPath)).replace(
      '.',
      '_',
    );
    const base = `${replacedName}.css`;
    compilation.virtualModule.set(hash, code);
    code = `import "${hash}?css_virtual&basename=${base}";export default ${JSON.stringify(
      modules,
    )}`;
    loader = 'js';
  }

  return {
    code,
    loader,
  };
};
