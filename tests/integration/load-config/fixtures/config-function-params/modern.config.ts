import path from 'path';
import { writeFileSync } from 'fs';
import appTools, {
  AppTools,
  CliPlugin,
  defineConfig,
} from '@modern-js/app-tools';

export default defineConfig(params => {
  const testPlugin: CliPlugin<AppTools> = {
    name: 'test-plugin',
    setup: api => {
      const write = () => {
        writeFileSync(
          path.resolve(api.useAppContext().distDirectory, 'params.json'),
          JSON.stringify(params),
        );
      };
      return {
        afterDev: write,
        afterBuild: write,
      };
    },
  };

  return {
    plugins: [appTools(), testPlugin],
  };
});
