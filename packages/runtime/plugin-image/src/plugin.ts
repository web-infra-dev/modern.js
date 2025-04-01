import fs from 'fs';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginImage = (): RsbuildPlugin => {
  return {
    name: 'plugin-image',
    setup(api) {},
  };
};
