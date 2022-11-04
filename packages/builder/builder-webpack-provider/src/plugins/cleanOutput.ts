import type { BuilderPlugin } from '../types';

export const PluginCleanOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-clean-output',

  setup(api) {
    const clean = async () => {
      const config = api.getNormalizedConfig();

      if (config.output.cleanDistPath) {
        const { emptyDir } = await import('@modern-js/utils');
        const { distPath } = api.context;
        await emptyDir(distPath);
      }
    };

    api.onBeforeBuild(clean);
    api.onBeforeStartDevServer(clean);
  },
});
