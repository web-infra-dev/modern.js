import assert from 'assert';
import type { AppTools } from '@modern-js/app-tools';
import type { UserConfig } from '@modern-js/core';
import { SetupClientParams } from '@modern-js/devtools-kit';
import { Plugin } from '../types';

export const pluginHtml: Plugin = {
  async setup(api) {
    api.frameworkHooks.hook('config', async () => {
      // Inject options to client.
      const clientOptions: SetupClientParams = {
        def: api.context.def,
        src: '/__devtools',
      };
      // Keep resource query always existing.
      Object.assign(clientOptions, { __keep: true });
      const serializedOptions = JSON.stringify(clientOptions);
      const tags: AppTools['normalizedConfig']['html']['tags'] = [
        {
          tag: 'script',
          children: `window.__MODERN_JS_DEVTOOLS_OPTIONS__ = ${serializedOptions};`,
          head: true,
          append: false,
        },
      ];

      const styles: string[] = [];
      const manifest = require('@modern-js/devtools-client/manifest');
      // Inject JavaScript chunks to client.
      for (const src of manifest.routeAssets.mount.assets) {
        assert(typeof src === 'string');
        if (src.endsWith('.js')) {
          tags.push({
            tag: 'script',
            attrs: { src },
            head: true,
            append: false,
          });
        } else if (src.endsWith('.css')) {
          styles.push(src);
        }
      }
      // Inject CSS chunks to client inside of template to avoid polluting global.
      tags.push({
        tag: 'template',
        attrs: { id: '_modern_js_devtools_styles' },
        append: true,
        head: false,
        children: styles
          .map(src => `<link rel="stylesheet" href="${src}">`)
          .join(''),
      });

      const config: UserConfig<AppTools> = { html: { tags } };
      return config;
    });
  },
};
