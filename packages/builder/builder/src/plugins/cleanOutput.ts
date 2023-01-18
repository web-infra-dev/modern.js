import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const builderPluginCleanOutput = (): DefaultBuilderPlugin => ({
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
