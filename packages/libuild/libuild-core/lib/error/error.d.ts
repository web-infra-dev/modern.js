import { LibuildErrorInstance, LibuildErrorParams, CodeFrameOption, ControllerOption } from '../types';
export declare class LibuildError extends Error implements LibuildErrorInstance {
    static from(err: unknown, opt?: LibuildErrorParams): LibuildError;
    readonly prefixCode: string;
    readonly code: string;
    readonly reason?: string;
    readonly hint?: string;
    readonly referenceUrl?: string;
    private codeFrame?;
    private _controller;
    private readonly _level;
    constructor(code: string, message: string, opts?: LibuildErrorParams);
    get level(): "Ignore" | "Warn" | "Error";
    get path(): string | undefined;
    set path(file: string | undefined);
    private printCodeFrame;
    toString(): string;
    setControllerOption(opt: ControllerOption): void;
    setCodeFrame(opt: CodeFrameOption): void;
    isSame(error: LibuildError): boolean;
}
//# sourceMappingURL=error.d.ts.map