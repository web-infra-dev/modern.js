import { LibuildErrorInstance, LogLevel, ErrorLevel, LibuildErrorParams } from '../types';
import { LibuildFailure } from './failure';
import { LibuildError } from './error';
/**
 * we can't use instanceof LibuildError, because it may not be an singleton class
 * @param err
 * @returns
 */
export declare function isLibuildErrorInstance(err: unknown): err is LibuildError;
export declare function formatError(err: Error | LibuildErrorInstance): string;
export declare function toLevel(level: keyof typeof ErrorLevel): ErrorLevel;
export declare function insertSpace(rawLines: string, line: number, width: number): string;
export declare function warpErrors(libuildErrors: LibuildError[], logLevel?: LogLevel): LibuildFailure;
export declare function transform(err: any, opt?: LibuildErrorParams): LibuildError;
//# sourceMappingURL=utils.d.ts.map