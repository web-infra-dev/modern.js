import { LibuildFailure } from '../error';
import { CLIConfig, BuildConfig, ILibuilder, LibuildPlugin, Chunk, Callback, BuilderResolveResult, BuilderResolveOptions, ILibuilderStage, ILibuilderHooks, IBuilderBase, LibuildErrorParams, LibuildErrorInstance } from '../types';
import { TransformContext } from './transform';
import { SourcemapContext } from './sourcemap';
export declare class Libuilder implements ILibuilder {
    static run(config?: CLIConfig, name?: string): Promise<Libuilder | Libuilder[]>;
    static create(config?: CLIConfig, name?: string): Promise<Libuilder>;
    compilation: IBuilderBase;
    version: string;
    watchedFiles: Set<string>;
    hooks: ILibuilderHooks;
    STAGE: ILibuilderStage;
    userConfig: CLIConfig;
    config: BuildConfig;
    plugins: LibuildPlugin[];
    outputChunk: Map<string, Chunk>;
    virtualModule: Map<string, string>;
    name?: string;
    private errors;
    private watcher?;
    private transformContextMap;
    private sourcemapContextMap;
    init(config: CLIConfig): Promise<void>;
    build(): Promise<void>;
    close(callback?: Callback): Promise<void>;
    emitAsset(name: string, chunk: string | Chunk): void;
    addWatchFile(id: string): void;
    resolve(_source: string, _opt?: BuilderResolveOptions): Promise<BuilderResolveResult>;
    loadSvgr(_path: string): Promise<void>;
    getTransformContext(path: string): TransformContext;
    getSourcemapContext(path: string): SourcemapContext;
    report(err: any): void;
    throw(message: string, opts?: LibuildErrorParams): void;
    printErrors(): void;
    getErrors(): LibuildFailure;
    clearErrors(): void;
    removeError(...errors: LibuildErrorInstance[]): void;
}
//# sourceMappingURL=index.d.ts.map