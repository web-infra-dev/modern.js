import path from 'path';
import fs from 'fs-extra';
import type { CliPlugin, ModuleTools } from '@modern-js/self';

export const plugin3 = (): CliPlugin<ModuleTools> => {
  return {
    name: 'plugin-3',
    setup: () => {
      return {
        registerBuildPlatform() {
          return {
            platform: 'plugin-3',
            build: async (currentPlatform, context) => {
              const distPath = path.join(__dirname, './dist/plugin-3.json');
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
