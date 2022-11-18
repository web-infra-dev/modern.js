import path from 'path';
import { fs } from '@modern-js/utils';
import type { CliPlugin, ModuleToolsHooks } from '../../utils';

export default (): CliPlugin<ModuleToolsHooks> => {
  return {
    name: 'plugin-2',
    setup: () => {
      return {
        registerBuildPlatform() {
          return {
            platform: 'plugin-2',
            build: async (currentPlatform, context) => {
              const distPath = path.join(__dirname, './dist/plugin-2.json');

              const content = JSON.stringify({ currentPlatform, ...context });

              try {
                await fs.ensureFile(distPath);
                await fs.writeFile(distPath, content, 'utf-8');
              } catch (e) {
                console.info(e);
              }
            },
          };
        },
      };
    },
  };
};
