/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-expect-error lint-staged is not typed
import lintStaged from 'lint-staged';
import { logger, chalk } from '@modern-js/utils';

const printFormattedMsg = (success: boolean) => {
  logger.log('');
  logger.log('==============================');
  logger.log('');
  if (success) {
    logger.log('[PRECOMMIT] Verified!');
    logger.log(
      'Please commit all autofixes caused by eslint, stylelint and prettier',
    );
  } else {
    logger.log('[PRECOMMIT] failed!');
    logger.log('');
    logger.log(
      'For TRULY URGENT case (like hotfix), you can skip the pre-commit checking:',
    );
    logger.log('git commit --no-verify -m "message"');
    logger.log('Otherwise, you should solve all above issues one by one');
  }

  logger.log('');
};

export default async () => {
  try {
    // run lint-staged
    const success = await lintStaged();
    printFormattedMsg(success);
  } catch (err) {
    logger.error(chalk.red(err));
  }
};
