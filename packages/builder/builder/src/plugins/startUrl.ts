import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types/plugin';
import { getCompiledPath } from '@modern-js/builder-shared';

export function PluginStartUrl(): BuilderPlugin {
  return {
    name: 'builder-plugin-start-url',
    async setup(api) {
      let port: number;

      api.onAfterStartDevServer(async params => {
        ({ port } = params);
      });

      api.onDevCompileDone(async ({ isFirstCompile }) => {
        if (!isFirstCompile || !port) {
          return;
        }
        const config = api.getNormalizedConfig();
        const { startUrl } = config.dev;
        if (!startUrl) {
          return;
        }
        // todo: prebundle `open` to modern/shared ？
        const { default: open } = await import(getCompiledPath('open'));
        const urls: string[] = [];
        if (startUrl === true) {
          const protocol = config.dev.https ? 'https' : 'http';
          urls.push(`${protocol}://localhost:${port}`);
        } else {
          urls.push(..._.castArray(startUrl));
        }
        for (const url of urls) {
          await open(url);
        }
      });
    },
  };
}
