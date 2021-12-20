export type Metrics = {
  counter: () => void;
  timer: () => void;
  gauges: () => void;
};

type LoggerFunction = (
  message?: number | string | Error,
  ...args: any[]
) => void;
export type Logger = {
  error: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  debug: LoggerFunction;
  log: LoggerFunction;
};

export type NextFunction = () => void;
