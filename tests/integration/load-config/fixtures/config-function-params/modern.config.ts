import path from 'path';
import { writeFileSync } from 'fs';
import { AppTools, CliPlugin, defineConfig } from '@modern-js/app-tools';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default defineConfig<'rspack'>(params => {
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

  return applyBaseConfig({
    plugins: [testPlugin],
  });
});
