import { Rspack, webpack } from '@modern-js/app-tools';
import { Plugin } from '../types';

export const pluginSettleState: Plugin = {
  async setup(api) {
    let _pendingCompiler = 0;
    const handleSettle = async () => {
      _pendingCompiler -= 1;
      if (_pendingCompiler === 0) {
        await api.hooks.callHook('settleState');
      }
    };
    const handleDone = (
      compiler: Rspack.Compiler | webpack.Compiler | webpack.MultiCompiler,
    ) => {
      if ('compilers' in compiler) {
        compiler.compilers.forEach(handleDone);
      } else {
        _pendingCompiler += 1;
        compiler.hooks.done.tapPromise(
          { name: '@modern-js/plugin-devtools', stage: 4000 },
          () => handleSettle(),
        );
      }
    };
    api.frameworkHooks.hook('afterCreateCompiler', ({ compiler }) => {
      compiler && handleDone(compiler);
    });
  },
};
