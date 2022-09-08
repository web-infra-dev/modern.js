import { BuilderPlugin } from '../types/plugin';

export function PluginStartUrl(): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-start-url',
    async setup(api) {
      let port: number;

      api.onAfterStartDevServer(async params => {
        ({ port } = params);
      });

      api.onDevCompileDone(async ({ isFirstCompile }) => {
        if (!isFirstCompile || !port) {
          return;
        }

        const config = api.getBuilderConfig();
        const startUrl = config.dev?.startUrl;
        if (typeof startUrl === 'string' || Array.isArray(startUrl)) {
          const { default: open } = await import('../../compiled/open');
          const urls = Array.isArray(startUrl) ? startUrl : [startUrl];
          for (const url of urls) {
            await open(url);
          }
        } else if (startUrl === true) {
          const { default: open } = await import('../../compiled/open');
          const protocol = config.dev?.https ? 'https' : 'http';
          await open(`${protocol}://localhost:${port}`);
        }
      });
    },
  };
}
