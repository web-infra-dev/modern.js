import * as rollup from '../rollup';
import ts from 'typescript';

interface Options {
    /**
     * The plugin will by default flag *all* external libraries as `external`,
     * and thus prevent them from be bundled.
     * If you set the `respectExternal` option to `true`, the plugin will not do
     * any default classification, but rather use the `external` option as
     * configured via rollup.
     */
    respectExternal?: boolean;
    /**
     * In case you want to use TypeScript path-mapping feature, using the
     * `baseUrl` and `paths` properties, you can pass in `compilerOptions`.
     */
    compilerOptions?: ts.CompilerOptions;
    /**
     * Path to tsconfig.json, by default, will try to load 'tsconfig.json'
     */
    tsconfig?: string;
}

declare function rollupPluginDts(options?: Options): {
    name: string;
    outputOptions: (this: rollup.PluginContext, options: rollup.OutputOptions) => {
        chunkFileNames: string | ((chunkInfo: rollup.PreRenderedChunk) => string);
        entryFileNames: string | ((chunkInfo: rollup.PreRenderedChunk) => string);
        format: "es";
        exports: "named";
        compact: false;
        freeze: true;
        interop: "esModule";
        generatedCode: {
            symbols: boolean;
        } & (rollup.GeneratedCodePreset | rollup.GeneratedCodeOptions | undefined);
        strict: false;
        amd?: rollup.AmdOptions | undefined;
        assetFileNames?: string | ((chunkInfo: rollup.PreRenderedAsset) => string) | undefined;
        banner?: string | rollup.AddonFunction | undefined;
        dir?: string | undefined;
        dynamicImportFunction?: string | undefined;
        dynamicImportInCjs?: boolean | undefined;
        esModule?: boolean | "if-default-prop" | undefined;
        experimentalDeepDynamicChunkOptimization?: boolean | undefined;
        experimentalMinChunkSize?: number | undefined;
        extend?: boolean | undefined;
        externalImportAssertions?: boolean | undefined;
        externalLiveBindings?: boolean | undefined;
        file?: string | undefined;
        footer?: string | rollup.AddonFunction | undefined;
        globals?: rollup.GlobalsOption | undefined;
        hoistTransitiveImports?: boolean | undefined;
        indent?: string | boolean | undefined;
        inlineDynamicImports?: boolean | undefined;
        intro?: string | rollup.AddonFunction | undefined;
        manualChunks?: rollup.ManualChunksOption | undefined;
        minifyInternalExports?: boolean | undefined;
        name?: string | undefined;
        namespaceToStringTag?: boolean | undefined;
        noConflict?: boolean | undefined;
        outro?: string | rollup.AddonFunction | undefined;
        paths?: rollup.OptionsPaths | undefined;
        plugins?: rollup.OutputPluginOption;
        preferConst?: boolean | undefined;
        preserveModules?: boolean | undefined;
        preserveModulesRoot?: string | undefined;
        sanitizeFileName?: boolean | ((fileName: string) => string) | undefined;
        sourcemap?: boolean | "inline" | "hidden" | undefined;
        sourcemapBaseUrl?: string | undefined;
        sourcemapExcludeSources?: boolean | undefined;
        sourcemapFile?: string | undefined;
        sourcemapPathTransform?: rollup.SourcemapPathTransformOption | undefined;
        systemNullSetters?: boolean | undefined;
        validate?: boolean | undefined;
    };
    renderChunk: (this: rollup.PluginContext, code: string, chunk: rollup.RenderedChunk, options: rollup.NormalizedOutputOptions) => {
        code: string;
        map: {
            mappings: "";
        };
    };
    options(this: rollup.MinimalPluginContext, options: rollup.InputOptions): {
        onwarn(warning: rollup.RollupLog, warn: rollup.WarningHandler): void;
        treeshake: {
            moduleSideEffects: "no-external";
            propertyReadSideEffects: true;
            unknownGlobalSideEffects: false;
        };
        acorn?: Record<string, unknown> | undefined;
        acornInjectPlugins?: (() => unknown)[] | (() => unknown) | undefined;
        cache?: false | rollup.RollupCache | undefined;
        context?: string | undefined;
        experimentalCacheExpiry?: number | undefined;
        external?: rollup.ExternalOption | undefined;
        inlineDynamicImports?: boolean | undefined;
        input?: rollup.InputOption | undefined;
        makeAbsoluteExternalsRelative?: boolean | "ifRelativeSource" | undefined;
        manualChunks?: rollup.ManualChunksOption | undefined;
        maxParallelFileOps?: number | undefined;
        maxParallelFileReads?: number | undefined;
        moduleContext?: ((id: string) => string | rollup.NullValue) | {
            [id: string]: string;
        } | undefined;
        perf?: boolean | undefined;
        plugins?: rollup.InputPluginOption;
        preserveEntrySignatures?: rollup.PreserveEntrySignaturesOption | undefined;
        preserveModules?: boolean | undefined;
        preserveSymlinks?: boolean | undefined;
        shimMissingExports?: boolean | undefined;
        strictDeprecations?: boolean | undefined;
        watch?: false | rollup.WatcherOptions | undefined;
    };
    transform(this: rollup.TransformPluginContext, code: string, id: string): {
        code: string;
        ast: any;
        map: any;
    } | null;
    resolveId(this: rollup.PluginContext, source: string, importer: string | undefined): {
        id: string;
        external: true;
    } | {
        id: string;
        external?: undefined;
    } | undefined;
};

export { Options, rollupPluginDts as default };
