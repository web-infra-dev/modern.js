import { PartialBaseBuildConfig, defineConfig } from '@modern-js/module-tools';
import { universalBuildConfig } from '@scripts/build';

export default defineConfig({
  buildConfig: universalBuildConfig as PartialBaseBuildConfig[],
});
