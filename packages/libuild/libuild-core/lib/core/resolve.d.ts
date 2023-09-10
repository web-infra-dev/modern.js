import { ImportKind } from 'esbuild';
import { UserConfig } from '../types';
export declare const jsExtensions: string[];
/**
 * supports require js plugin in less file
 */
export declare const cssExtensions: string[];
interface ResolverOptions {
    platform: NonNullable<UserConfig['platform']>;
    resolveType: 'css' | 'js';
    root: string;
    mainFields?: string[];
    mainFiles?: string[];
    alias?: Record<string, string>;
    preferRelative?: boolean;
    extensions?: string[];
    enableNativeResolve?: boolean;
}
export declare const createResolver: (options: ResolverOptions) => (id: string, dir: string, kind?: ImportKind) => string;
export {};
//# sourceMappingURL=resolve.d.ts.map