import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('ts-node-loader', () => {
  it('should resolve prefix aliases from source.alias to TypeScript files', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-tools-loader-'));
    const appDir = path.join(rootDir, 'app');
    const serviceDir = path.join(rootDir, 'service');
    const serviceFile = path.join(serviceDir, 'user.ts');
    const loaderPath = path.resolve(
      __dirname,
      '../../src/esm/ts-node-loader.mjs',
    );

    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(serviceFile, 'export const user = 1;\n');

    try {
      const output = childProcess.execFileSync(
        process.execPath,
        [
          '-e',
          `
            const path = require('node:path');
            const { pathToFileURL } = require('node:url');

            (async () => {
              const loader = await import(
                pathToFileURL(${JSON.stringify(loaderPath)}).href,
              );
              await loader.initialize({
                baseUrl: ${JSON.stringify(appDir)},
                paths: {
                  '@service': [${JSON.stringify('../service')}],
                  '@service/*': [${JSON.stringify('../service/*')}],
                },
              });
              const resolved = {};
              for (const specifier of ['@service/user', '@service/user.js']) {
                resolved[specifier] = await loader.resolve(
                  specifier,
                  {},
                  value => ({ url: value }),
                );
              }
              console.log(JSON.stringify(resolved));
            })().catch(error => {
              console.error(error);
              process.exit(1);
            });
          `,
        ],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
        },
      );

      const resolved = JSON.parse(output.trim());
      expect(
        fs.realpathSync(fileURLToPath(resolved['@service/user'].url)),
      ).toBe(fs.realpathSync(serviceFile));
      expect(
        fs.realpathSync(fileURLToPath(resolved['@service/user.js'].url)),
      ).toBe(fs.realpathSync(serviceFile));
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
