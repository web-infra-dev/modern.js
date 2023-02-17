import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { logger } from '@modern-js/utils';

webpackOnlyTest('should emit progress log in non-TTY environment', async () => {
  process.stdout.isTTY = false;

  const { info, success } = logger;
  const infoMsgs: any[] = [];
  const successMsgs: any[] = [];

  logger.info = message => {
    infoMsgs.push(message);
  };
  logger.success = message => {
    successMsgs.push(message);
  };

  await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  expect(
    infoMsgs.some(message => message.includes('[Client] compile progress')),
  ).toBeTruthy();
  expect(
    successMsgs.some(message => message.includes('[Client] compile succeed')),
  ).toBeTruthy();

  process.stdout.isTTY = true;
  logger.info = info;
  logger.success = success;
});
