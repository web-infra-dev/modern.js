import { BuilderPlugin } from '../types/plugin';

export function PluginStartUrl(): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-start-url',
    async setup(api) {
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
        const { getPort } = await import('@modern-js/utils');
        const port = await getPort(config.dev?.port || 8080);
        await open(`${protocol}://localhost:${port}`);
      }
    },
  };
}
