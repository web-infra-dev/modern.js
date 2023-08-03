import { defineConfig } from '@/toolkit';
import path from 'path';

export default defineConfig({
  input: {
    main: './index.tsx',
    ts: '/index.ts?virtual',
  },
  format: 'esm',
  external: [/^antd(\/.*)?/],
  plugins: [
    {
      name: 'ts-as-tsx',
      apply(compiler) {
        compiler.hooks.load.tap('ts-as-tsx', (args) => {
          if (args.path.endsWith('/index.ts?virtual')) {
            return {
              loader: 'tsx',
              contents: `
              import { Button } from 'antd';

              const value: any = <Button></Button>;
              console.log(value);
              `,
              resolveDir: path.resolve(__dirname),
            };
          }
        });
      },
    },
  ],
});
