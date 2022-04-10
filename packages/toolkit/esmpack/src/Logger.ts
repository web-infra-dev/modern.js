/* eslint-disable no-console */
import { chalk } from '@modern-js/utils';

export type LogType = 'error' | 'warn' | 'debug' | 'info' | 'silent' | 'silly';

const levels: Record<LogType, number> = {
  silly: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90,
};

export const LOG_SYMBOL = Symbol('esmpack logger');

class Logger {
  public level: LogType = 'info';

  constructor(public name: string) {
    if (!name) {
      throw new TypeError('Logger requires a name');
    }
  }

  public debug(message: string) {
    this.log({ type: 'debug', message });
  }
  public info(message: string) {
    this.log({ type: 'info', message });
  }
  public warn(message: string) {
    this.log({ type: 'warn', message });
  }
  public error(message: string) {
    this.log({ type: 'error', message });
  }
  public silly(message: string) {
    this.log({ type: 'silly', message });
  }

  private callbacks: Record<LogType, (message: string) => void> = {
    silly: message => {
      console.log(message);
    },
    debug: message => {
      console.log(message);
    },
    info: message => {
      console.log(message);
    },
    warn: message => {
      console.warn(message);
    },
    error: message => {
      console.error(message);
    },
    silent: () => {},
  };

  private log({ type, message }: { type: LogType; message: string }) {
    if (levels[this.level] > levels[type]) {
      return;
    }

    let text = message;
    switch (type) {
      case 'warn': {
        text = chalk.yellow(text);
        break;
      }
      case 'error': {
        text = chalk.red(text);
        break;
      }
      default: {
        break;
      }
    }

    const finalText = `${chalk.dim(`[${this.name}]`)} ${text}`;

    if ('function' === typeof this.callbacks[type]) {
      this.callbacks[type](finalText);
    }
  }
}

export { Logger };
