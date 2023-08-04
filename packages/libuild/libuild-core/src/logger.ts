import chalk from 'chalk';
import { LogLevel, ILoggerOptions, ILogger } from './types';

const LogLevels: Readonly<Record<LogLevel, number>> = {
  silent: 0,
  error: 1,
  warning: 3,
  info: 4,
  debug: 5,
  verbose: 6,
};

const NUM_OF_MILLISEC_IN_SEC = BigInt(1000000);

export class Logger implements ILogger {
  constructor(public opts: ILoggerOptions) {}

  private times: Map<string, bigint> = new Map();

  timesLog: Map<string, number> = new Map();

  private output(level: LogLevel, ...message: string[]) {
    if (getLogLevel(this.opts.level || 'info') < getLogLevel(level)) {
      return;
    }

    const format = () => {
      if (this.opts.timestamp) {
        return [`${chalk.dim(new Date().toLocaleTimeString())} ${message.join(' ')}`];
      }
      return message;
    };
    console.log(...format());
  }

  info(...msg: string[]) {
    this.output('info', chalk.bold.blue('INFO'), ...msg);
  }

  warn(...msg: string[]) {
    this.output('warning', chalk.bold.yellow('WARN'), ...msg);
  }

  error(...msg: string[]) {
    this.output('error', chalk.bold.red('ERROR'), ...msg);
  }

  debug(...info: string[]) {
    this.output('debug', chalk.bold.magentaBright('DEBUG'), ...info);
  }

  time(label: string) {
    this.times.set(label, process.hrtime.bigint());
  }

  timeEnd(label: string) {
    const time = process.hrtime.bigint();
    const start = this.times.get(label);
    if (!start) {
      throw new Error(`Time label '${label}' not found for Logger.timeEnd()`);
    }
    this.times.delete(label);
    const diff = time - start;
    const diffMs = Number(diff / NUM_OF_MILLISEC_IN_SEC);
    this.timesLog.set(label, diffMs);
    this.debug(`Time label ${label} took ${diffMs}ms`);
  }
}

export function createLogger(options: ILoggerOptions = { level: 'info', timestamp: false }) {
  return new Logger(options);
}

export function getLogLevel(logLevel: LogLevel): number {
  return LogLevels[logLevel];
}
