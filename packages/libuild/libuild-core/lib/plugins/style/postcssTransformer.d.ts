import { ILibuilder } from '../../types';
export declare const isCssModule: (filePath: string, autoModules: boolean | RegExp) => boolean;
export declare const postcssTransformer: (css: string, entryPath: string, compilation: ILibuilder) => Promise<{
    code: string;
    loader: 'js' | 'css';
}>;
//# sourceMappingURL=postcssTransformer.d.ts.map