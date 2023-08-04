import { defineConfig } from '@/toolkit';

export = defineConfig({
  plugins: [
    {
      name: 'external',
      apply(compiler) {
        compiler.hooks.resolve.tapPromise('external', async (args) => {
          if (args.path.startsWith('~virtual')) {
            return { path: args.path };
          }
        });
        compiler.hooks.load.tapPromise('external', async (args) => {
          if (args.path.startsWith('~virtual')) {
            return {
              contents: `import answer from "the-answer"; export default answer;`,
              loader: 'js',
            };
          }
        });
      },
    },
  ],
});
