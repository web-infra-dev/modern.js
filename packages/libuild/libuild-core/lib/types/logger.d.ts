/**
 * Options for log level.
 */
export type LogLevel = 'silent' | 'error' | 'warning' | 'info' | 'debug' | 'verbose';
export interface ILoggerOptions {
    /**
     * @default 'info'
     */
    level?: LogLevel;
    /**
     * @default false
     */
    timestamp?: boolean;
}
type Label = string;
export declare abstract class ILogger {
    abstract timesLog: Map<Label, number>;
    abstract info(...msg: string[]): void;
    abstract warn(...msg: string[]): void;
    abstract error(...msg: string[]): void;
    abstract debug(...msg: string[]): void;
    abstract time(label: Label): void;
    abstract timeEnd(label: Label): void;
}
export {};
//# sourceMappingURL=logger.d.ts.map