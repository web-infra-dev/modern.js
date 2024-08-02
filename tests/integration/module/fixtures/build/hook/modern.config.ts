import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    hooks: [
      {
        name: 'before1',
        apply: compiler => {
          compiler.hooks.transform.tapPromise(
            { name: 'before1' },
            async args => {
              const code = "export const name = 'before1';";
              return {
                ...args,
                code,
              };
            },
          );
        },
      },
      {
        name: 'after',
        applyAfterBuiltIn: true,
        apply: compiler => {
          compiler.hooks.transform.tapPromise({ name: 'after' }, async args => {
            const code = "export const name = 'after';";
            return {
              ...args,
              code,
            };
          });
        },
      },
      {
        name: 'before2',
        apply: compiler => {
          compiler.hooks.transform.tapPromise(
            { name: 'before2' },
            async args => {
              const code = "export const name = 'before2';";
              return {
                ...args,
                code,
              };
            },
          );
        },
      },
    ],
  },
});
