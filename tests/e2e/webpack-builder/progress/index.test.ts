import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { logger } from '@modern-js/utils';

test('should emit progress log in non-TTY environment', async () => {
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

  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
  });
  await builder.build();

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
