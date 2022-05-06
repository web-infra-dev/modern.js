import chalk, { Color } from '../compiled/chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMsg = number | string | Error;

interface LoggerConfiguration {
  color?: typeof Color;
  label?: string;
  level?: LogLevel;
}

interface InstanceConfiguration {
  displayLabel?: boolean;
  underlineLabel?: boolean;
  uppercaseLabel?: boolean;
}

interface ConstructorOptions {
  config?: InstanceConfiguration;
  level?: string;
  types?: Record<string, LoggerConfiguration>;
}

type LoggerFunction = (
  message?: number | string | Error,
  ...args: any[]
) => void;

const { grey, underline } = chalk;

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
    color: 'blue',
    label: 'info',
    level: 'info',
  },
  warn: {
    color: 'yellow',
    label: 'warning',
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
  underlineLabel: true,
  uppercaseLabel: false,
};

class Logger {
  private readonly logCount: number = 200;

  private readonly level: string;

  private history: Partial<Record<string, Array<string>>> = {};

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

  private retainLog(type: string, message: string) {
    if (!this.history[type]) {
      this.history[type] = [];
    }
    this.history[type]!.push(message);
    while (this.history[type]!.length > this.logCount) {
      this.history[type]!.shift();
    }
  }

  private _log(type: string, message?: LogMsg, ...args: string[]) {
    if (message === undefined) {
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

      if (this.config.underlineLabel) {
        label = underline(label).padEnd(this.longestUnderlinedLabel.length + 1);
      } else {
        label = label.padEnd(this.longestLabel.length + 1);
      }

      label = logType.color ? chalk[logType.color](label) : label;
    }

    if (message instanceof Error) {
      if (message.stack) {
        const [name, ...rest] = message.stack.split('\n');
        text = `${name}\n${grey(rest.join('\n'))}`;
      } else {
        text = message.message;
      }
    } else {
      text = `${message}`;
    }

    // only retain logs of warn/error level
    if (logType.level === 'warn' || logType.level === 'error') {
      // retain log text without label
      this.retainLog(type, text);
    }

    const log = label.length > 0 ? `${label}  ${text}` : text;
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

  private get longestUnderlinedLabel() {
    return underline(this.longestLabel);
  }

  getRetainedLogs(type: string) {
    return this.history[type] || [];
  }

  clearRetainedLogs(type: string) {
    if (type) {
      if (this.history[type]) {
        this.history[type] = [];
      }
    } else {
      this.history = {};
    }
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
