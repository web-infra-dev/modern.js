import type { ChildProcess } from 'child_process';
import EventEmitter from 'events';
import { chalk } from '@modern-js/utils';

export const clearFlag = '\x1Bc';

export const logTemplate = (
  title: string,
  messageStack: string[],
  maxLength: number,
  {
    noBottomBorder = false,
    bottomBorderText = '',
    noLeftBorder = false,
    leftBorder = '│',
    contentColor = (s: string) => s,
  } = {},
) => {
  const leftBorderFlag = noLeftBorder ? '' : leftBorder;
  const messageFragments = messageStack
    .map(p => {
      p.trim();

      return `${leftBorderFlag}${p.replace(clearFlag, '')}`;
    }) // 移除 clearFlag
    .filter(s => s !== leftBorderFlag) // 过滤空字符串
    .slice(0, maxLength) // 控制长度
    .reverse(); // 调换顺序，最新的消息在最后面
  messageFragments[messageFragments.length - 1] =
    messageFragments[messageFragments.length - 1].trim();
  const template = `${title}:
${contentColor(messageFragments.join(''))}${
    noBottomBorder ? '' : `\n${bottomBorderText}`
  }`;
  console.info('template', messageFragments);
  return template;
};

export type STDOUT = ChildProcess['stdout'] | NodeJS.ReadStream;
export type STDERR = ChildProcess['stdout'] | NodeJS.ReadStream;

export interface LoggerTextOption {
  title: string;
  maxLength: number;
  contentConfig?: {
    noBottomBorder?: boolean;
    bottomBorderText?: string;
    noLeftBorder?: boolean;
    leftBorder?: string;
    contentColor?: (s: string) => string;
    replace?: string[];
  };
}

export class LoggerText {
  messages: string[];

  option: LoggerTextOption;

  constructor(option: LoggerTextOption) {
    this.messages = [];
    this.option = option;
  }

  append(message: string) {
    const replace = this.option.contentConfig?.replace || [];
    let content = message;
    for (const r of replace) {
      content = content.replace(new RegExp(r, 'g'), '');
    }
    this.messages.push(content);
  }

  get value() {
    const { title, maxLength, contentConfig } = this.option;
    const messages = [...new Set(this.messages)];
    return logTemplate(title, messages, maxLength, contentConfig);
  }
}

interface IAddStdoutConfig {
  event?: { data?: boolean; error?: boolean };
  colors?: {
    data?: (s: string) => string;
    error?: (s: string) => string;
    warning?: (s: string) => string;
  };
}

export class LoggerManager extends EventEmitter {
  // constructor() {}

  createLoggerText(option: LoggerTextOption) {
    return new LoggerText(option);
  }

  addStdout(
    loggerText: LoggerText,
    stdout: STDOUT,
    config: IAddStdoutConfig = {},
  ) {
    const {
      event = { data: true, error: true },
      colors = {
        data: chalk.green,
        error: chalk.red,
        warning: chalk.yellow,
      },
    } = config;
    if (event.data) {
      stdout?.on('data', chunk => {
        const data = chunk.toString();
        const content = colors.data ? colors.data(data) : chalk.green(data);
        loggerText.append(content);
        this.emit('data');
      });
    }

    if (event.error) {
      stdout?.on('error', error => {
        const data = error.message;
        const content = colors.error ? colors.error(data) : chalk.red(data);
        loggerText.append(content);
        this.emit('data');
      });
    }
  }

  addStderr(loggerText: LoggerText, stderr: STDERR) {
    stderr?.on('data', chunk => {
      const data = chunk.toString();
      loggerText.append(data);
    });
  }

  show(loggerText: LoggerText) {
    console.info(loggerText.value);
  }
}
