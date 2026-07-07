import { appTools, defineConfig } from '@modern-js/app-tools';
import { pluginBabel } from '@rsbuild/plugin-babel';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  builderPlugins: [
    pluginBabel({
      babelLoaderOptions: (_config, { addPlugins }) => {
        addPlugins(['babel-plugin-react-compiler']);
      },
    }),
  ],
  plugins: [appTools()],
});
