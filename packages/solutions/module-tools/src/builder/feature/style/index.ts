import { readFileSync } from 'fs';
import { identifier } from 'safe-identifier';
import { isStyleExt } from '../../../utils';
import { Source, ICompiler } from '../../../types';
import { transformStyle } from './transformStyle';

const name = 'css';
export const css = {
  name,
  hooks(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (isStyleExt(args.path)) {
        if (args.pluginData?.css_virtual) {
          const contents = compiler.virtualModule.get(args.path)!;
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
    compiler.hooks.transform.tapPromise(
      { name },
      async (source): Promise<Source> => {
        if (isStyleExt(source.path)) {
          let { code, loader = 'css' } = source;
          if (!source.pluginData?.css_virtual) {
            ({ code, loader } = await transformStyle.apply(compiler, [source]));
          }
          const { style, buildType } = compiler.config;
          if (style.inject && buildType === 'bundle' && loader === 'css') {
            const styleInjectPath = require
              .resolve('style-inject/dist/style-inject.es')
              .replace(/[\\/]+/g, '/');
            const cssVariableName = identifier('css', true);
            code = `var ${cssVariableName} = ${JSON.stringify(
              code,
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
      },
    );
  },
};
