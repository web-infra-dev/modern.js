import { devtoolsPlugin } from '@modern-js/plugin-devtools';
import { defineConfig, appTools } from '@modern-js/app-tools';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

const disableClientServer = !process.env.DOCTOR_SERVER;

export default defineConfig({
  runtime: {
    router: true,
  },
  source: {
    mainEntryName: 'main',
    // preEntry: ['./src/prelude.css'],
  },
  output: {
    // disable polyfill and ts checker to make test faster
    polyfill: 'off',
    disableTsChecker: true,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    devServer: {},
    rspack(config, { appendPlugins }) {
      appendPlugins(
        new RsdoctorRspackPlugin({
          disableClientServer,
          linter: {
            rules: {
              'ecma-version-check': 'off',
              'duplicate-package': 'off',
            },
          },
        }),
      );
    },
  },
  plugins: [appTools({ bundler: 'experimental-rspack' }), devtoolsPlugin()],
});
