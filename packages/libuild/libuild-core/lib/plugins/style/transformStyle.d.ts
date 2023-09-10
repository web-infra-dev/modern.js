/// <reference types="node" />
import { PartialMessage } from 'esbuild';
import { ILibuilder, Source } from '../../types';
export type PreprocessRender = (content: string, stdinPath: string, stdinDir: string, preprocessOptions: any, resolvePathMap: Map<string, string>) => Promise<{
    css: Buffer | string;
    errors?: PartialMessage[];
    warnings?: PartialMessage[];
    map?: Buffer | string;
}>;
export declare function transformStyle(this: ILibuilder, source: Source): Promise<{
    code: string;
    loader: "css" | "js";
}>;
//# sourceMappingURL=transformStyle.d.ts.map