import { appTools, defineConfig } from '@modern-js/app-tools';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

const isCI = process.env.CI === 'true';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  runtime: {
    router: true,
  },

  tools: {
    bundlerChain: chain => {
      if (process.env.RSDOCTOR) {
        chain.plugin('rsdoctor').use(RsdoctorRspackPlugin, [
          {
            output: isCI
              ? {
                  mode: 'brief',
                  options: {
                    type: ['json'],
                  },
                }
              : {},
            features: isCI ? ['bundle'] : ['bundle', 'loader', 'plugins'],
          },
        ]);
      }
    },
  },
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
  ],
});
