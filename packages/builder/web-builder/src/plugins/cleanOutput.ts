import type { BuilderPlugin } from '../types';

export const PluginCleanOutput = (): BuilderPlugin => ({
  name: 'web-builder-plugin-clean-output',

  setup(api) {
    const clean = async () => {
      const { emptyDir } = await import('@modern-js/utils');
      const { distPath } = api.context;
      await emptyDir(distPath);
    };

    api.onBeforeBuild(clean);
    api.onBeforeCreateCompiler(clean);
  },
});
