import path from 'path';
import fs from 'fs-extra';
import type { CliPlugin, ModuleTools } from '@modern-js/self';

export const plugin4 = (): CliPlugin<ModuleTools> => {
  return {
    name: 'plugin-4',
    setup: () => {
      return {
        registerBuildPlatform() {
          return {
            platform: 'plugin-4',
            build: async (currentPlatform, context) => {
              const distPath = path.join(__dirname, './dist/plugin-4.json');
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
