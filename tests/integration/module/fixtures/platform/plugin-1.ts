import path from 'path';
import type { CliPlugin, ModuleTools } from '@modern-js/self';
import fs from 'fs-extra';

export const plugin1 = (): CliPlugin<ModuleTools> => {
  return {
    name: 'plugin-1',
    setup: () => {
      return {
        registerBuildPlatform() {
          return {
            platform: 'plugin-1',
            build: async (currentPlatform, context) => {
              const distPath = path.join(__dirname, './dist/plugin-1.json');
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
