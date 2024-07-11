import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { logger } from '@modern-js/uni-builder';

webpackOnlyTest('should emit progress log in non-TTY environment', async () => {
  process.stdout.isTTY = false;

  const { info, ready } = logger;
  const infoMsgs: any[] = [];
  const readyMsgs: any[] = [];

  logger.info = message => {
    infoMsgs.push(message);
  };
  logger.ready = message => {
    readyMsgs.push(message);
  };

  await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      dev: {
        progressBar: true,
      },
    },
  });

  expect(
    infoMsgs.some(message => message.includes('Compile progress')),
  ).toBeTruthy();
  expect(readyMsgs.some(message => message.includes('Compiled'))).toBeTruthy();

  process.stdout.isTTY = true;
  logger.info = info;
  logger.ready = ready;
});
