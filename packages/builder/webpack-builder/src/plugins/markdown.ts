import type { BuilderPlugin } from '../types';

export const PluginMarkdown = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-markdown',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID, getCompiledPath }) => {
      chain.module
        .rule(CHAIN_ID.RULE.MARKDOWN)
        .test(/\.md$/)
        .use(CHAIN_ID.USE.HTML)
        .loader(require.resolve('html-loader'))
        .end()
        .use(CHAIN_ID.USE.MARKDOWN)
        .loader(getCompiledPath('markdown-loader'));
    });
  },
});
