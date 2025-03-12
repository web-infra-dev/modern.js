import fs from 'fs';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginImage = (): RsbuildPlugin => {
  return {
    name: 'plugin-image',
    setup(api) {
      console.log(fs.writeFile);
      api.onAfterBuild(({ stats }) => {
        console.log(stats);
      });
    },
  };
};
