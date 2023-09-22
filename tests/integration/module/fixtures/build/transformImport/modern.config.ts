import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['./src/index.ts'],
      transformImport: [
        {
          libraryName: '@arco-design/web-react',
          style: true,
          libraryDirectory: 'es',
        },
      ],
      target: 'esnext',
      format: 'esm',
      buildType: 'bundleless',
    },
  ],
});
