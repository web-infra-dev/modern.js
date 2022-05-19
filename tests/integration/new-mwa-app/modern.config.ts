import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableInlineScripts: true,
  },
  runtime: {
    router: true,
    state: true,
  },
  tools: {
    webpackChain(chain, { CHAIN_ID }) {
      const entries = Object.keys(chain.entryPoints.entries());
      entries.forEach(entry => {
        chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`).tap(options => ({
          ...options,
          inject: 'body',
        }));
      });
    },
  },
});
