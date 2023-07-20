import { createRequire } from 'module';
import { dtsConfig } from '@scripts/build';
import { tailwindConfig } from './tailwind.config';

const require = createRequire(import.meta.url);
const tailwindPlugin = require('@modern-js/plugin-tailwindcss').default;

// https://modernjs.dev/module-tools/en/api
export default {
  plugins: [tailwindPlugin()],
  testing: {
    transformer: 'ts-jest',
  },
  designSystem: tailwindConfig.theme,
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      outDir: 'dist',
      sourceMap: true,
      dts: dtsConfig,
      externals: ['@modern-js/mdx-rs-binding', 'jsdom'],
    },
    {
      input: {
        loader: './src/node/mdx/loader.ts',
      },
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      outDir: 'dist',
      sourceMap: true,
      dts: dtsConfig,
      externals: ['@modern-js/mdx-rs-binding'],
      esbuildOptions: options => {
        options.banner = {
          js: 'import { createRequire } from "module";\nconst { url } = import.meta;\nconst require = createRequire(url);',
        };
        return options;
      },
    },
    {
      input: {
        bundle: './src/theme-default/index.ts',
      },
      copy: {
        patterns: [
          {
            from: './.theme-entry.ts',
            to: './index.ts',
            context: __dirname,
          },
        ],
      },
      outDir: 'dist/theme',
      sourceMap: true,
      format: 'esm',
      dts: dtsConfig,
      externals: [
        'virtual-routes-ssr',
        'virtual-routes',
        '@theme',
        'virtual-search-index-hash',
        'virtual-site-data',
        'virtual-global-styles',
        'virtual-global-components',
        'virtual-search-hooks',
        '@/runtime',
        '@runtime',
      ],
      asset: {
        svgr: true,
      },
      style: {
        tailwindcss: {
          // ...tailwindConfig,
          darkMode: 'class',
        },
        modules: {
          localsConvention: 'camelCase',
        },
      },
    },
  ],
};
