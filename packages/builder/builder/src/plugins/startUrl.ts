import _ from '@modern-js/utils/lodash';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const replacePlaceholder = (url: string, port: number) =>
  url.replace(/<port>/g, String(port));

const openedURLs: string[] = [];

export function builderPluginStartUrl(): DefaultBuilderPlugin {
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
        const { https, startUrl } = config.dev;

        if (!startUrl) {
          return;
        }

        const urls: string[] = [];

        if (startUrl === true) {
          const protocol = https ? 'https' : 'http';
          urls.push(`${protocol}://localhost:${port}`);
        } else {
          urls.push(
            ..._.castArray(startUrl).map(item =>
              replacePlaceholder(item, port),
            ),
          );
        }

        const { openBrowser } = await import('@modern-js/builder-shared');

        for (const url of urls) {
          /**
           * If a URL has been opened in current process, we will not open it again.
           * It can prevent opening the same URL multiple times.
           */
          if (!openedURLs.includes(url)) {
            await openBrowser(url);
            openedURLs.push(url);
          }
        }
      });
    },
  };
}
