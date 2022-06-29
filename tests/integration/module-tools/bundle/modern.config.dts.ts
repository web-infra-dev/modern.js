import { defineConfig } from "@modern-js/module-tools";

export = defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        entry: {
          index: './dts/index.ts',
        },
      },
      outputPath: './dts',
    }
  },
});
