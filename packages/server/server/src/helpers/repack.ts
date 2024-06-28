import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { ServerHookRunner } from '@modern-js/server-core';

const cleanSSRCache = (distDir: string) => {
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(distDir)) {
      delete require.cache[key];
    }
  });
};

export const onRepack = (distDir: string, runner: ServerHookRunner) => {
  cleanSSRCache(distDir);
  fileReader.reset();
  runner.reset({
    event: {
      type: 'repack',
    },
  });
};
