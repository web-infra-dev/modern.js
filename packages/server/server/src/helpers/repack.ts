import {
  fileReader,
  type FileReader,
} from '@modern-js/runtime-utils/fileReader';
import type { ServerPluginHooks } from '@modern-js/server-core';

const cleanSSRCache = (distDir: string) => {
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(distDir)) {
      delete require.cache[key];
    }
  });
};

export const onRepack = async (
  distDir: string,
  hooks: ServerPluginHooks,
  reader: FileReader = fileReader,
) => {
  cleanSSRCache(distDir);
  await reader.reset();
  await hooks.onReset.call({
    event: {
      type: 'repack',
    },
  });
};
