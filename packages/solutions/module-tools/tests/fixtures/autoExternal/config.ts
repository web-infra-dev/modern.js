import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: false,
      outDir: './dist/1',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: false,
      externals: ['react'],
      outDir: './dist/2',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: {
        dependencies: true,
      },
      outDir: './dist/3',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      outDir: './dist/4',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: {
        peerDependencies: true,
      },
      outDir: './dist/5',
    },
  ],
});
