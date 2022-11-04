import { Compiler, Module, Compilation, LoaderContext } from 'webpack';
import { EmitCountMap, InternalOptions } from './';
interface BeforeRunHookArgs {
    emitCountMap: EmitCountMap;
    manifestFileName: string;
}
interface EmitHookArgs {
    compiler: Compiler;
    emitCountMap: EmitCountMap;
    manifestAssetId: string;
    manifestFileName: string;
    moduleAssets: Record<any, any>;
    options: InternalOptions;
}
declare const getCompilerHooks: (compiler: Compiler) => any;
declare const beforeRunHook: ({ emitCountMap, manifestFileName }: BeforeRunHookArgs, _: Compiler, callback: Function) => void;
declare const emitHook: ({ compiler, emitCountMap, manifestAssetId, manifestFileName, moduleAssets, options }: EmitHookArgs, compilation: Compilation) => void;
interface LegacyModule extends Module {
    userRequest?: any;
}
declare const normalModuleLoaderHook: ({ moduleAssets }: {
    moduleAssets: Record<any, any>;
}, loaderContext: LoaderContext<any>, module: LegacyModule) => void;
export { beforeRunHook, emitHook, getCompilerHooks, normalModuleLoaderHook };
