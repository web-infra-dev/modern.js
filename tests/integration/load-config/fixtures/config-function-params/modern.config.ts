import { writeFileSync } from 'fs';
import path from 'path';
import {
  type AppTools,
  type CliPlugin,
  defineConfig,
} from '@modern-js/app-tools';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

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

      api.onAfterDev(() => {
        write();
      });
      api.onAfterBuild(() => {
        write();
      });
    },
  };

  return applyBaseConfig({
    plugins: [testPlugin],
  });
});
