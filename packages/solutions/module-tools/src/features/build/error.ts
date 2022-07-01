import { chalk } from '@modern-js/utils';
import type { ExecaError } from '@modern-js/utils';
import type { BuildType, Format, Target } from '../../schema/types';

export const padSpaceWith = (
  str: string,
  targetL: number,
  opts: {
    endStr?: string;
    style?: (s: string) => string;
  } = {},
) => {
  const { endStr = '|', style } = opts;
  const l = str.length;
  const endStrL = endStr.length;
  const resetL = targetL - l - endStrL;

  // str is 'aaa', targetL is 4, result is 'aaa|'
  if (resetL === 0) {
    return (style ? style(str) : str) + endStr;
  }

  // str is 'aaa', targetL is 5, result is 'aaa |'
  if (resetL > 0) {
    const padStr = str.padEnd(targetL - 1, ' ');
    if (style) {
      return style(str) + padStr.replace(str, '') + endStr;
    }
    return padStr + endStr;
  }

  return str;
};

export class InternalBuildError extends Error {
  public buildType: BuildType;

  public target: Target;

  public format: Format;

  private e: Error;

  constructor(
    e: Error,
    opts: {
      buildType: BuildType;
      format: Format;
      target: Target;
    },
  ) {
    super(e.message);

    Error.captureStackTrace(this, this.constructor);

    this.e = e;
    this.buildType = opts.buildType;
    this.target = opts.target;
    this.format = opts.format;
  }

  toString() {
    return this.formatError().join('\n');
  }

  formatError() {
    const msgs: string[] = [];
    const { e, buildType, target, format } = this;
    const textL = 25;
    const title = `│ ${padSpaceWith(`${buildType} failed:`, textL - 2, {
      style: chalk.red.underline,
      endStr: '│',
    })}`;
    const formatMsg = padSpaceWith(`│  - format is "${format}"`, textL, {
      endStr: '│',
    });
    const targetMsg = padSpaceWith(`│  - target is "${target}"`, textL, {
      endStr: '│',
    });
    const startLine = padSpaceWith('╭'.padEnd(textL - 1, '─'), textL, {
      endStr: '╮',
    });
    const endLine = padSpaceWith('╰'.padEnd(textL - 1, '─'), textL, {
      endStr: '╯',
    });
    msgs.push(
      startLine,
      title,
      formatMsg,
      targetMsg,
      endLine,
      chalk.blue.bold.underline(`\nDetailed Information: `),
    );
    msgs.push(e.toString());
    msgs.push(e.stack || '');

    return msgs;
  }
}

export class InternalDTSError extends Error {
  public buildType: BuildType;

  private e: Error;

  constructor(e: Error | ExecaError, opts: { buildType: BuildType }) {
    super(e.message);

    Error.captureStackTrace(this, this.constructor);

    this.e = e;
    this.buildType = opts.buildType;
  }

  toString() {
    return this.formatError().join('\n');
  }

  formatError() {
    const msgs: string[] = [];
    const { e, buildType } = this;
    msgs.push(chalk.red.bold(`${buildType} DTS failed:`));
    if (isExecaError(e)) {
      /**
       * `shortMeessage` content like:
       * 'Command failed with exit code 2: /Users/github/modern.js/playground/module/node_modules/.bin/tsc -p /Users/github/modern.js/playground/module/node_modules/tsconfig.temp.json --pretty'
       * Don`t need it.
       */
      if (e.stack) {
        msgs.push(e.stack?.replace(`${e.name}: ${e.shortMessage}`, ''));
      }
    } else {
      msgs.push(e.stack!);
    }

    return msgs;
  }
}

export class ModuleBuildError extends Error {
  constructor(e: InternalBuildError | InternalDTSError) {
    super(`\n\n${e}`);
    Error.captureStackTrace(this, this.constructor);
    this.name = 'ModuleBuildError';
  }
}

export const isInternalError = (
  e: unknown,
): e is InternalDTSError | InternalBuildError => {
  if (e instanceof InternalBuildError || e instanceof InternalDTSError) {
    return true;
  }

  return false;
};

export const isExecaError = (e: any): e is ExecaError => {
  if (e.stdout) {
    return true;
  }

  return false;
};
