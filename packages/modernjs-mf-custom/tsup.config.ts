import { join } from 'path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [join(__dirname, 'src', 'index.ts')],
  dts: true,
  splitting: true,
  clean: true,
  format: ['cjs', 'esm'],
  outDir: 'packages/third-party-dts-extractor/dist',
  external: [join(__dirname, 'package.json')],
});
