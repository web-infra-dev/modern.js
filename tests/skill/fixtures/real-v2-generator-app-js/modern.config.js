import { appTools } from '@modern-js/app-tools';

// https://modernjs.dev/configure/app/usage
module.exports = {
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: 'rspack',
    }),
  ],
};
