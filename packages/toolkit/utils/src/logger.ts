import chalk, { Color } from '../compiled/chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMsg = number | string | Error | null;

interface LoggerConfiguration {
  color?: typeof Color;
  label?: string;
  level?: LogLevel;
}

interface InstanceConfiguration {
  displayLabel?: boolean;
  uppercaseLabel?: boolean;
}

interface ConstructorOptions {
  config?: InstanceConfiguration;
  level?: string;
  types?: Record<string, LoggerConfiguration>;
}

type LoggerFunction = (message?: LogMsg, ...args: any[]) => void;

const LOG_LEVEL: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  log: 4,
};

const LOG_TYPES = {
  error: {
    color: 'red',
    label: 'error',
    level: 'error',
  },
  info: {
    color: 'cyan',
    label: 'info',
    level: 'info',
  },
  success: {
    color: 'green',
    label: 'Success',
    level: 'info',
  },
  warn: {
    color: 'yellow',
    label: 'warn',
    level: 'warn',
  },
  debug: {
    color: 'red',
    label: 'debug',
    level: 'debug',
  },
  log: { level: 'log' },
};

const DEFAULT_CONFIG = {
  displayLabel: true,
  uppercaseLabel: false,
};

class Logger {
  private readonly level: string;

  private readonly config: InstanceConfiguration;

  private readonly types: Record<string, LoggerConfiguration>;

  private readonly longestLabel: string;

  [key: string]: any;

  constructor(options: ConstructorOptions = {}) {
    this.level = options.level || LOG_TYPES.log.level;
    this.config = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.types = {
      ...(LOG_TYPES as Record<string, LoggerConfiguration>),
      ...(options.types || {}),
    };
    this.longestLabel = this.getLongestLabel();

    Object.keys(this.types).forEach(type => {
      this[type] = this._log.bind(this, type);
    });
  }

  private _log(type: string, message?: LogMsg, ...args: string[]) {
    if (message === undefined || message === null) {
      // eslint-disable-next-line no-console
      console.log();
      return;
    }

    if (LOG_LEVEL[type] > LOG_LEVEL[this.level]) {
      return;
    }

    let label = '';
    let text = '';
    const logType = this.types[type];

    if (this.config.displayLabel && logType.label) {
      label = this.config.uppercaseLabel
        ? logType.label.toUpperCase()
        : logType.label;
      label = label.padEnd(this.longestLabel.length);
      label = chalk.bold(logType.color ? chalk[logType.color](label) : label);
    }

    if (message instanceof Error) {
      if (message.stack) {
        const [name, ...rest] = message.stack.split('\n');
        text = `${name}\n${chalk.grey(rest.join('\n'))}`;
      } else {
        text = message.message;
      }
    } else {
      text = `${message}`;
    }

    const log = label.length > 0 ? `${label} ${text}` : text;
    // eslint-disable-next-line no-console
    console.log(log, ...args);
  }

  private getLongestLabel() {
    let longestLabel = '';
    Object.keys(this.types).forEach(type => {
      const { label = '' } = this.types[type];
      if (label.length > longestLabel.length) {
        longestLabel = label;
      }
    });
    return longestLabel;
  }
}

type LoggerInterface = {
  [key in keyof typeof LOG_TYPES]: LoggerFunction;
};

const logger = new Logger() as Logger & LoggerInterface;

logger.Logger = Logger;

export { Logger };

export { logger };
export type { LoggerInterface };
