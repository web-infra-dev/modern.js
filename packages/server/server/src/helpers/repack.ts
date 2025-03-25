import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { ServerPluginHooks } from '@modern-js/server-core';

const cleanSSRCache = (distDir: string) => {
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(distDir)) {
      delete require.cache[key];
    }
  });
};

export const onRepack = (distDir: string, hooks: ServerPluginHooks) => {
  cleanSSRCache(distDir);
  fileReader.reset();
  hooks.onReset.call({
    event: {
      type: 'repack',
    },
  });
};
