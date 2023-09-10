import { Plugin } from 'esbuild';
import { ILibuilder } from '../types';
/**
 * proxy libuild hooks to esbuild
 */
export declare const adapterPlugin: (compiler: ILibuilder) => Plugin;
export declare function findEntry(paths: string[], otherPaths: string): string | null;
//# sourceMappingURL=adapter.d.ts.map