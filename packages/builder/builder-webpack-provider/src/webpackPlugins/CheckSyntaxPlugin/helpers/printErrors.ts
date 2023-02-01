import { SyntaxError } from './type';
import chalk from '@modern-js/utils/chalk';
import { logger } from '@modern-js/builder-shared';

type Error = {
  source: string;
  output?: string;
  reason: string;
  code: string;
};

export function printErrors(errors: SyntaxError[]) {
  if (errors.length === 0) {
    logger.success('The syntax check success.');
    return;
  }

  const errs: Error[] = errors.map(error => ({
    source: `${error.source.path}:${error.source.line}:${error.source.column}`,
    output: error.output
      ? `${error.output.path}:${error.output.line}:${error.output.column}`
      : undefined,
    reason: error.message,
    code: error.source.code,
  }));

  const longest = Math.max(...Object.keys(errs[0]).map(err => err.length));
  logger.error(
    '[Syntax Checker] Find some syntax errors after production build:\n',
  );

  errs.forEach((err, index) => {
    console.info(`${chalk.red(`  ERROR#${index + 1}`)}:`);
    printMain(err, longest);
  });

  throw new Error(
    `[Syntax Checker] The current build fails due to an incompatible syntax, which can be fixed in the following ways:

  - If you want to downgrade the syntax, you can compile the corresponding module through the \`source.include\` config.
  - If you don't want to downgrade the syntax, you can adjust the project's browserslist to match the syntax.`,
  );
}

function printMain(error: Error, logest: number) {
  const fillWhiteSpace = (s: string, logest: number) => {
    if (s.length < logest) {
      const rightPadding = ' '.repeat(logest - s.length);
      return s + rightPadding;
    }
    return s;
  };
  Object.entries(error).forEach(([key, content]) => {
    if (!content) {
      return;
    }
    const title = chalk.red(fillWhiteSpace(key, logest));
    console.info(`  ${title} - ${content}`);
  });
  console.info('');
}
