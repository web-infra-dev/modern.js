import { readFileSync } from 'fs';
import { identifier } from 'safe-identifier';
import { isStyleExt, resolvePathAndQuery } from '../../../utils';
import type { Source, ICompiler } from '../../../types';
import { transformStyle } from './transformStyle';

const name = 'css';
export const css = {
  name,
  apply(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (isStyleExt(args.path)) {
        const { query } = resolvePathAndQuery(args.path);

        if (query?.css_virtual) {
          const key = query.hash as string;
          const contents = compiler.virtualModule.get(key)!;
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
          const { query } = resolvePathAndQuery(source.path);
          if (!query?.css_virtual) {
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
