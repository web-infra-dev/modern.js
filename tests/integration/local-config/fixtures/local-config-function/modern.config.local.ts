import { defineConfig } from '@modern-js/app-tools';

export default function () {
  return defineConfig({
    output: {
      distPath: {
        root: 'dist/bar',
      },
    },
  });
}
