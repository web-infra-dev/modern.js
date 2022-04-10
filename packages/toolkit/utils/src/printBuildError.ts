/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */

// Modified by Chao Xu (xuchaobei)

import { chalk } from './compiled';
import { logger } from './logger';

export function printBuildError(err: Error) {
  const message = err != null && err.message;
  const stack = err != null && err.stack;

  // Add more helpful message for Terser error
  if (
    stack &&
    typeof message === 'string' &&
    message.indexOf('from Terser') !== -1
  ) {
    try {
      const matched = /(.+)\[(.+):(.+),(.+)\]\[.+\]/.exec(stack);
      if (!matched) {
        throw new Error('Using errors for control flow is bad.');
      }
      const problemPath = matched[2];
      const line = matched[3];
      const column = matched[4];
      logger.error(
        `Failed to minify the code from this file: \n\n ${chalk.yellow(
          `\t${problemPath}:${line}${column !== '0' ? ':' + column : ''}`,
        )}\n`,
      );
    } catch (ignored) {
      logger.error(`Failed to minify the bundle. ${err}\n`);
    }
  } else {
    logger.error((message || err) + '\n');
  }
  logger.log();
}
/* eslint-enable */
