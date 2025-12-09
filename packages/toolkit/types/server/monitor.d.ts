/** Monitor Events  */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEvent {
  type: 'log';
  payload: {
    level: LogLevel;
    message: string;
    args?: any[];
  };
}

export interface TimingEvent {
  type: 'timing';
  payload: {
    name: string;
    dur: number;
    desc?: string;
    tags?: Record<string, any>;
    args?: any[];
  };
}

export interface CounterEvent {
  type: 'counter';
  payload: {
    name: string;
    tags?: Record<string, any>;
    args?: any[];
  };
}

export type MonitorEvent = LogEvent | TimingEvent | CounterEvent;

export type CoreMonitor = (event: MonitorEvent) => void;

export interface Monitors {
  push(monitor: CoreMonitor): void;

  // 日志事件
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;

  // 打点事件
  timing(
    name: string,
    dur: number,
    desc?: string,
    tags?: Record<string, any>,
    ...args: any[]
  ): void;
  counter(name: string, tags?: Record<string, any>, ...args: any[]): void;
}
