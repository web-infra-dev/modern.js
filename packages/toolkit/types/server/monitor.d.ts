/* eslint-disable @typescript-eslint/method-signature-style */
/** Monitor Events  */
export type LogLevel = 'warn' | 'error' | 'debug' | 'info';

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
  };
}

export interface StatsEvent {
  type: 'counter';
  payload: {
    name: string;
    value: number;
    [key: string]: unknown;
  };
}

export type MonitorEvent = LogEvent | TimingEvent | StatsEvent;

export type CoreMonitor = (event: MonitorEvent) => void;

export interface Monitors {
  push(monitor: CoreMonitor): void;

  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;

  timing(name: string, dur: number, desc?: string): void;

  emit(event: MonitorEvent): void;
}
