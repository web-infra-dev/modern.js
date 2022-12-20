import { join } from 'path';
import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import { fs } from '@modern-js/utils';

const logs: string[] = [];

export default defineConfig({
  builderPlugins: [
    {
      name: 'plugin-foo',
      setup(api) {
        api.onBeforeCreateCompiler(() => {
          logs.push('before create compiler');
        });
        api.onAfterCreateCompiler(() => {
          logs.push('after create compiler');
        });
        api.onBeforeBuild(() => {
          logs.push('before build');
        });
        api.onAfterBuild(() => {
          logs.push('after build');
        });
        api.onExit(() => {
          fs.outputFileSync(join(api.context.distPath, 'log'), logs.join('\n'));
        });
      },
    },
    {
      name: 'plugin-bar',
      setup(api) {
        api.onBeforeCreateCompiler(() => {
          logs.push('before create compiler 2');
        });
        api.onAfterCreateCompiler(() => {
          logs.push('after create compiler 2');
        });
        api.onBeforeBuild(() => {
          logs.push('before build 2');
        });
        api.onAfterBuild(() => {
          logs.push('after build 2');
        });
      },
    },
  ],
  plugins: [AppToolsPlugin()],
});
