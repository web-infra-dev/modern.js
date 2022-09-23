import { logger as modernLogger } from '@modern-js/utils';

enum Level {
  info = 0,
  warn = 1,
  error = 2,
}

interface Msg {
  level: Level;
  msg: string;
}

export class Logger {
  history: Msg[] = [];

  namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  _log(level: Level, msg: string) {
    const item: Msg = {
      level,
      msg,
    };
    this.history.push(item);

    let type;
    switch (level) {
      case Level.info: {
        type = 'info';
        break;
      }
      case Level.warn: {
        type = 'warn';
        break;
      }
      case Level.error: {
        type = 'error';
        break;
      }
      default:
        throw new TypeError('invalid level');
    }

    modernLogger[type](`[${this.namespace}] ${msg}`);
  }

  info(msg: string) {
    this._log(Level.info, msg);
  }

  warn(msg: string) {
    this._log(Level.warn, msg);
  }

  error(msg: string) {
    this._log(Level.error, msg);
  }
}

export const logger = new Logger('swc-plugin');
