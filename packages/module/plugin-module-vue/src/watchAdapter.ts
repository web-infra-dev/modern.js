import { dirname } from 'path';
import {
  resolvePathAndQuery,
  type BaseBuildConfig,
  type ICompiler,
} from '@modern-js/module-tools';
import { ImportKind, Plugin } from 'esbuild';

export const vueWatchAdapterPlugin = (config: BaseBuildConfig): Plugin => {
  let compiler = null as unknown as ICompiler;
  config.hooks.push({
    name: 'vue-watch-adapter',
    apply(_compiler: ICompiler) {
      compiler = _compiler;
    },
  });
  return {
    name: 'esbuild:vue-watch-adapter',
    setup(build) {
      build.onResolve({ filter: /\.vue$/ }, args => {
        if (compiler) {
          const { context } = compiler;
          const { root } = context;
          const getResultPath = (id: string, dir: string, kind: ImportKind) => {
            return id.endsWith('.css')
              ? compiler.css_resolve(id, dir)
              : compiler.node_resolve(id, dir, kind);
          };
          const { originalFilePath } = resolvePathAndQuery(args.path);
          const dir =
            args.resolveDir ?? (args.importer ? dirname(args.importer) : root);
          const path = getResultPath(originalFilePath, dir, args.kind);
          if (path) {
            compiler.addWatchFile(path);
          }
        }
        return {
          path: undefined,
          namespace: undefined,
        };
      });
    },
  };
};
