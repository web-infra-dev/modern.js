import type { RsbuildPlugin } from '@rsbuild/core';
import type { RsbuildTarget } from '@rsbuild/shared';

export const pluginExtensionPrefix = (
  prefixInfo: string | Partial<Record<RsbuildTarget, string>>,
): RsbuildPlugin => ({
  name: 'uni-builder:extension-prefix',

  setup(api) {
    api.modifyBundlerChain((chain, { target }) => {
      // add an extra prefix to all extensions
      const prefix =
        typeof prefixInfo === 'string' ? prefixInfo : prefixInfo[target];

      if (prefix) {
        const extensions = chain.resolve.extensions.values();

        chain.resolve.extensions.clear();

        extensions.forEach(ext => {
          chain.resolve.extensions.add(prefix + ext);
          chain.resolve.extensions.add(ext);
        });
      }
    });
  },
});
