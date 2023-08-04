import { Instance, Chalk } from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';
import deepEql from 'deep-eql';
import { isDef } from '@modern-js/libuild-utils';
import { transform, toLevel, insertSpace } from './utils';
import { LibuildErrorInstance, LibuildErrorParams, CodeFrameOption, ControllerOption, ErrorLevel } from '../types';

export class LibuildError extends Error implements LibuildErrorInstance {
  static from(err: unknown, opt?: LibuildErrorParams): LibuildError {
    if (err instanceof LibuildError) {
      return err;
    }

    return transform(err, opt);
  }

  readonly prefixCode: string;

  readonly code: string;

  readonly reason?: string;

  readonly hint?: string;

  readonly referenceUrl?: string;

  private codeFrame?: CodeFrameOption;

  private _controller: ControllerOption = {
    noStack: true,
    noColor: false,
  };

  private readonly _level: ErrorLevel;

  constructor(code: string, message: string, opts?: LibuildErrorParams) {
    super(message);
    this.code = code;
    this.hint = opts?.hint;
    this.reason = opts?.reason;
    this.stack = opts?.stack;
    this._level = opts?.level ? toLevel(opts.level) : ErrorLevel.Error;
    this.referenceUrl = opts?.referenceUrl;
    this.codeFrame = opts?.codeFrame;
    this.prefixCode = opts?.prefixCode ?? 'Libuild';

    this.setControllerOption(opts?.controller ?? {});
  }

  get level() {
    return ErrorLevel[this._level] as keyof typeof ErrorLevel;
  }

  get path() {
    return this.codeFrame?.filePath;
  }

  set path(file: string | undefined) {
    if (!file) {
      return;
    }

    if (this.codeFrame) {
      this.codeFrame.filePath = file;
      return;
    }

    this.codeFrame = {
      filePath: file,
    };
  }

  private printCodeFrame(print: Chalk) {
    const msgs: string[] = [];
    const { codeFrame: codeFrameOpt, _controller: controller } = this;

    if (!codeFrameOpt) {
      return msgs;
    }

    // There are starting positions and specific codes need to be printed
    if ('start' in codeFrameOpt && codeFrameOpt.start) {
      const { filePath, start } = codeFrameOpt;

      // Print file path and starting point coordinates
      msgs.push(
        `\n ${print.red(print.bold('File: '))}${print.bold(filePath)}:${start.line}${
          start.column ? `:${start.column}` : ''
        }`
      );

      if ('fileContent' in codeFrameOpt) {
        const { end, fileContent } = codeFrameOpt;

        msgs.push(
          codeFrameColumns(
            fileContent,
            {
              start,
              end,
            },
            {
              highlightCode: !controller.noColor,
            }
          )
        );
      } else {
        const { length, lineText } = codeFrameOpt;
        let lineCodeFrame = codeFrameColumns(
          lineText,
          {
            start: {
              line: 1,
              column: start.column,
            },
            end: {
              line: 1,
              column: isDef(start.column) && isDef(length) ? start.column + length : undefined,
            },
          },
          {
            highlightCode: !controller.noColor,
          }
        );

        if (start.line > 1) {
          lineCodeFrame = lineCodeFrame.replace(' 1 |', ` ${start.line} |`);

          if (start.line >= 10) {
            lineCodeFrame = insertSpace(lineCodeFrame, 2, String(start.line).length - 1);
          }
        }

        msgs.push(lineCodeFrame);
      }
    }
    // If the starting location does not exist, only the file path is printed
    else {
      msgs.push(`\n ${print.red(print.bold('File: '))}${print.bold(codeFrameOpt.filePath)}\n`);
    }

    return msgs;
  }

  toString() {
    const msgs: string[] = [];
    const { code, reason, prefixCode, message, hint, referenceUrl, _controller: controller } = this;
    const print = controller.noColor ? new Instance({ level: 0 }) : new Instance({ level: 3 });
    const mainColorPrint = this._level === ErrorLevel.Error ? print.red : print.yellow;
    const reasonCode = reason ? `${mainColorPrint.blue(reason)}: ` : '';

    msgs.push(mainColorPrint.bold(`[${prefixCode.toUpperCase()}:${code.toUpperCase()}] `) + reasonCode + message);
    msgs.push(...this.printCodeFrame(print));

    if (hint) {
      msgs.push(`\n ${print.blue(`HINT: ${hint}`)}`);
    }

    if (referenceUrl) {
      msgs.push(print.magenta.bold(` See: ${referenceUrl}`));
    }

    if (!controller.noStack && this.stack) {
      msgs.push(print.red.bold(` Error Stack:\n${this.stack}\n`));
    }

    return msgs.join('\n');
  }

  setControllerOption(opt: ControllerOption) {
    this._controller = {
      noStack: opt.noStack ?? this._controller.noStack ?? true,
      noColor: opt.noColor ?? this._controller.noColor ?? false,
    };
  }

  setCodeFrame(opt: CodeFrameOption) {
    this.codeFrame = opt;
  }

  isSame(error: LibuildError) {
    const basicSame =
      this.code === error.code &&
      this.message === error.message &&
      this.hint === error.hint &&
      this._level === error._level &&
      this.referenceUrl === error.referenceUrl &&
      this.prefixCode === error.prefixCode &&
      deepEql(this.codeFrame, error.codeFrame);

    return basicSame;
  }
}
