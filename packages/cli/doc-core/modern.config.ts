import { createRequire } from 'module';
import { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);

const tailwindPlugin = require('@modern-js/plugin-tailwindcss').default;

const tailwindConfig: Config = {
  content: [],
  darkMode: 'class',
  theme: {
    backgroundColor: ctx => ({
      ...ctx.theme('colors'),
      white: 'var(--modern-c-bg)',
      soft: 'var(--modern-c-bg-soft)',
      mute: 'var(--modern-c-bg-mute)',
    }),
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      breakpoints: {
        xs: '640px',
        sm: '768px',
        md: '960px',
        lg: '1280px',
      },
      maxWidth: {
        '60': '15rem',
      },
      maxHeight: {
        '60': '15rem',
      },
      colors: {
        brand: {
          DEFAULT: 'var(--modern-c-brand)',
          light: 'var(--modern-c-brand-light)',
          dark: 'var(--modern-c-brand-dark)',
          lighter: 'var(--modern-c-brand-lighter)',
          darker: 'var(--modern-c-brand-darker)',
        },
        text: {
          1: 'var(--modern-c-text-1)',
          2: 'var(--modern-c-text-2)',
          3: 'var(--modern-c-text-3)',
          4: 'var(--modern-c-text-4)',
        },
        divider: {
          DEFAULT: 'var(--modern-c-divider)',
          light: 'var(--modern-c-divider-light)',
          dark: 'var(--modern-c-divider-dark)',
        },
        gray: {
          light: {
            1: 'var(--modern-c-gray-light-1)',
            2: 'var(--modern-c-gray-light-2)',
            3: 'var(--modern-c-gray-light-3)',
            4: 'var(--modern-c-gray-light-4)',
            5: 'var(--modern-c-gray-light-5)',
          },
        },
      },
    },
  },
};

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
      externals: ['@modern-js/mdx-rs-binding', '@rspack/core'],
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
      externals: [
        'virtual-routes-ssr',
        'virtual-routes',
        '@theme',
        'virtual-search-index-hash',
        'virtual-site-data',
        'virtual-global-styles',
        'virtual-global-components',
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
