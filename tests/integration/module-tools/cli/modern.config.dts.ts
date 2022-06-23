import { defineConfig } from "@modern-js/module-tools";

export = defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      enableDts: true,
      bundleOptions: {
        entry: {
          index: './dts/index.ts',
        }
      },
      outputPath: './dts',
    }
  },
});
