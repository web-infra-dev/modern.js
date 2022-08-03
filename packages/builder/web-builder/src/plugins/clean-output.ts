import type { WebBuilderPlugin } from '../types';

export const PluginCleanOutput = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-clean-output',

  setup(api) {
    api.modifyWebpackChain(() => {
      const clean = async () => {
        const { emptyDir } = await import('@modern-js/utils');
        const { distPath } = api.context;
        await emptyDir(distPath);
      };

      api.onBeforeBuild(clean);
      api.onBeforeCreateCompiler(clean);
    });
  },
});
