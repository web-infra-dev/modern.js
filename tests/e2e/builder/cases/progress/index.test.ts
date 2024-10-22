import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { logger } from '@modern-js/uni-builder';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

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
    infoMsgs.some(message => message.includes('Build progress')),
  ).toBeTruthy();
  expect(readyMsgs.some(message => message.includes('Built'))).toBeTruthy();

  process.stdout.isTTY = true;
  logger.info = info;
  logger.ready = ready;
});
