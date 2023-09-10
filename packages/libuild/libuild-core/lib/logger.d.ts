import { LogLevel, ILoggerOptions, ILogger } from './types';
export declare class Logger implements ILogger {
    opts: ILoggerOptions;
    constructor(opts: ILoggerOptions);
    private times;
    timesLog: Map<string, number>;
    private output;
    info(...msg: string[]): void;
    warn(...msg: string[]): void;
    error(...msg: string[]): void;
    debug(...info: string[]): void;
    time(label: string): void;
    timeEnd(label: string): void;
}
export declare function createLogger(options?: ILoggerOptions): Logger;
export declare function getLogLevel(logLevel: LogLevel): number;
//# sourceMappingURL=logger.d.ts.map