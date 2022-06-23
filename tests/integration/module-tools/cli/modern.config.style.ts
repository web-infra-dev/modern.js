import { defineConfig } from "@modern-js/module-tools";

export = defineConfig({
  output: {
    buildConfig: {
      bundlelessOptions: {
        sourceDir: './style-only',
        style: {
          compileMode: 'only-compiled-code',
        },
      },
    }
  },
});
