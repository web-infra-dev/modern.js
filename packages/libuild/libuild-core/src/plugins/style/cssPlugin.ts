import { resolvePathAndQuery, isStyleExt } from '@modern-js/libuild-utils';
import { readFileSync } from 'fs';
import { identifier } from 'safe-identifier';
import { Source, LibuildPlugin } from '../../types';
import { transformStyle } from './transformStyle';

export const cssPlugin = (): LibuildPlugin => {
  const cssVirtual = 'css_virtual';
  const pluginName = 'libuild:css';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.load.tapPromise(pluginName, async (args) => {
        if (isStyleExt(args.path)) {
          const { originalFilePath, query } = resolvePathAndQuery(args.path);
          if (query.css_virtual) {
            const contents = compiler.virtualModule.get(originalFilePath)!;
            return {
              contents,
              loader: 'css',
            };
          }
          return {
            contents: readFileSync(args.path),
            loader: 'css',
          };
        }
      });
      compiler.hooks.transform.tapPromise(pluginName, async (source): Promise<Source> => {
        if (isStyleExt(source.path)) {
          const { query } = resolvePathAndQuery(source.path);
          let { code, loader = 'css' } = source;
          if (!query[cssVirtual]) {
            ({ code, loader } = await transformStyle.apply(compiler, [source]));
          }
          const { style, bundle } = compiler.config;
          if (style.inject && bundle && loader === 'css') {
            const styleInjectPath = require.resolve('style-inject/dist/style-inject.es').replace(/[\\/]+/g, '/');
            const cssVariableName = identifier('css', true);
            code = `var ${cssVariableName} = ${JSON.stringify(
              code
            )};\nimport styleInject from '${styleInjectPath}';\nstyleInject(${cssVariableName});`;
            loader = 'js';
          }
          return {
            ...source,
            code,
            loader,
          };
        }
        return source;
      });
    },
  };
};
