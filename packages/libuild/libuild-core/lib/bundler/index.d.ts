import { BuildResult, BuildContext } from 'esbuild';
import { Callback, ILibuilder, IBuilderBase } from '../types';
export declare class EsbuildBuilder implements IBuilderBase {
    compiler: ILibuilder;
    instance?: BuildContext;
    result?: BuildResult;
    reBuildCount: number;
    constructor(compiler: ILibuilder);
    close(callback?: Callback): void;
    private report;
    private parseError;
    build(): Promise<void>;
    reBuild(type: 'link' | 'change'): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map