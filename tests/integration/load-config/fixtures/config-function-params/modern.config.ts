import { writeFileSync } from 'fs';
import path from 'path';
import {
  type AppTools,
  type CliPluginFuture,
  defineConfig,
} from '@modern-js/app-tools';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default defineConfig(params => {
  const testPlugin: CliPluginFuture<AppTools> = {
    name: 'test-plugin',
    setup: api => {
      const write = () => {
        writeFileSync(
          path.resolve(api.useAppContext().distDirectory, 'params.json'),
          JSON.stringify(params),
        );
      };

      api.afterDev(() => write);
      api.afterBuild(() => write);
    },
  };

  return applyBaseConfig({
    plugins: [testPlugin],
  });
});
