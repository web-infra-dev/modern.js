import type { BaseBuildConfig, ICompiler } from '@modern-js/module-tools';
import { Plugin } from 'esbuild';

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
      build.onLoad({ filter: /\.vue$/ }, async args => {
        if (compiler) {
          compiler.addWatchFile(args.path);
        }
        return undefined;
      });
    },
  };
};
