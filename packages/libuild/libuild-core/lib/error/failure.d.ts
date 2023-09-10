import { LibuildErrorInstance } from '../types';
export declare class LibuildFailure extends Error {
    readonly errors: LibuildErrorInstance[];
    readonly warnings: LibuildErrorInstance[];
    readonly logLevel: string;
    constructor(errors: LibuildErrorInstance[], warnings: LibuildErrorInstance[], logLevel: string);
    toString(): string;
}
//# sourceMappingURL=failure.d.ts.map