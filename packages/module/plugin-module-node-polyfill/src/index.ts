import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import type { NodePolyfillPluginOptions } from '@modern-js/libuild-plugin-node-polyfill';
import { nodePolyfillPlugin } from '@modern-js/libuild-plugin-node-polyfill';

export const modulePluginNodePolyfill = (
  polyfillOption: NodePolyfillPluginOptions = {},
): CliPlugin<ModuleTools> => ({
  name: 'polyfill-plugin',
  setup() {
    return {
      modifyLibuild(config, next) {
        config.plugins = [
          ...(config.plugins ?? []),
          nodePolyfillPlugin(polyfillOption),
        ];
        return next(config);
      },
    };
  },
});
