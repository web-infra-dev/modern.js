import chalk from 'chalk';
import util from 'util';
import stripAnsi from 'strip-ansi';
import { parse as stackParse } from 'stack-trace';
import {
  LibuildErrorInstance,
  LogLevel,
  ErrorLevel,
  EsbuildError,
  LibuildErrorParams,
  IConfigLoaderMessage,
} from '../types';
import { LibuildFailure } from './failure';
import { LibuildError } from './error';
import { ErrorCode } from '../constants/error';

/**
 * we can't use instanceof LibuildError, because it may not be an singleton class
 * @param err
 * @returns
 */
export function isLibuildErrorInstance(err: unknown): err is LibuildError {
  return err instanceof Error && err.constructor.name === LibuildError.name;
}

export function formatError(err: Error | LibuildErrorInstance) {
  const msgs: string[] = [];
  /**
   * do not show stack for LibuildError by default, which is not useful for user
   */
  if (isLibuildErrorInstance(err)) {
    msgs.push(err.toString());
  } else if (err instanceof Error) {
    if (err.stack) {
      msgs.push(err.stack);
    } else {
      msgs.push(chalk.red(err.message));
    }
  } else {
    msgs.push(util.inspect(err));
  }
  return msgs.join('\n');
}

export function ConfigLoaderMesaageToLibuildError({ message, location }: IConfigLoaderMessage, isError = true) {
  const code = isError ? ErrorCode.CONFIG_TRANSFORM_FAILED : ErrorCode.CONFIG_TRANSFORM_WARN;
  const level = isError ? 'Error' : 'Warn';

  if (!location) {
    return new LibuildError(code, message, {
      level,
    });
  }

  return new LibuildError(code, message, {
    level,
    codeFrame: {
      filePath: location.file,
      fileContent: location.source,
      start: {
        line: location.line ?? -1,
        column: location.column ?? -1,
      },
    },
  });
}

export function toLevel(level: keyof typeof ErrorLevel) {
  return ErrorLevel[level];
}

export function insertSpace(rawLines: string, line: number, width: number) {
  const lines = rawLines.split('\n');
  lines[line - 1] = Array(width).fill(' ').join('') + lines[line - 1];
  return lines.join('\n');
}

export function warpErrors(libuildErrors: LibuildError[], logLevel: LogLevel = 'error'): LibuildFailure {
  const warnings = libuildErrors.filter((item) => item.level === 'Warn');
  const errors = libuildErrors.filter((item) => item.level === 'Error');
  const error = new LibuildFailure(errors, warnings, logLevel);
  return error;
}

function isEsbuildError(err: any): err is EsbuildError {
  return 'pluginName' in err && 'text' in err && 'location' in err;
}

function clearMessage(str: string) {
  return stripAnsi(str).replace(/.*: (.*)\n\n[\s\S]*/g, '$1');
}

function clearStack(str: string) {
  return str.slice(str.indexOf('  at')).replace(/\s*at(.*) \((.*)\)/g, '$1\n$2\n');
}

function transformEsbuildError(err: any, opt?: LibuildErrorParams) {
  if (isEsbuildError(err)) {
    const errorCode = opt?.code ?? ErrorCode.ESBUILD_ERROR;
    const libuildError =
      typeof err.detail === 'object'
        ? LibuildError.from(err.detail)
        : new LibuildError(errorCode, clearMessage(err.text), {
            ...opt,
            hint: err.location?.suggestion,
            codeFrame: {
              filePath: err.text.split(':')[0],
            },
          });

    if (err.location) {
      libuildError.setCodeFrame({
        filePath: err.location.file,
        lineText: err.location.lineText,
        length: err.location.length,
        start: {
          line: err.location.line,
          column: err.location.column + 1,
        },
      });
    }

    return libuildError;
  }
}

function transformNormalError(err: any, opt?: LibuildErrorParams) {
  if ((err instanceof Error) as any) {
    const stacks = stackParse(err);

    // err.filename is Non-standard, so filePath may be undefined yet.
    const filePath = stacks[0]?.getFileName?.() || err.filename;
    return new LibuildError(err.name, clearMessage(err.message), {
      ...opt,
      codeFrame: {
        filePath,
      },
      stack: err.stack && clearStack(err.stack),
    });
  }
}

function defaultError(err: any, opt?: LibuildErrorParams) {
  return new LibuildError('UNKNOWN_ERROR', JSON.stringify(err), opt);
}

export function transform(err: any, opt?: LibuildErrorParams) {
  const transformers = [transformEsbuildError, transformNormalError];

  for (const fn of transformers) {
    const result = fn(err, opt);

    if (result) {
      return result;
    }
  }

  return defaultError(err, opt);
}
