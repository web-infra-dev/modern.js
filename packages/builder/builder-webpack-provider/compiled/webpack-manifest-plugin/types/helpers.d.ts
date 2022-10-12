import { AssetInfo, Chunk, Asset, Compilation } from 'webpack';
import { InternalOptions, Manifest } from './';
export interface FileDescriptor {
    chunk?: Chunk;
    isAsset: Boolean;
    isChunk: Boolean;
    isInitial: Boolean;
    isModuleAsset: Boolean;
    name: string;
    path: string;
}
export interface CompilationAssetInfo extends AssetInfo {
    sourceFilename: string;
}
export interface CompilationAsset extends Asset {
    chunks: any[];
    info: CompilationAssetInfo;
}
declare const generateManifest: (compilation: Compilation, files: FileDescriptor[], { generate, seed }: InternalOptions) => Manifest;
declare const reduceAssets: (files: FileDescriptor[], asset: CompilationAsset, moduleAssets: Record<any, any>) => FileDescriptor[];
declare const reduceChunk: (files: FileDescriptor[], chunk: Chunk, options: InternalOptions, auxiliaryFiles: Record<any, any>) => FileDescriptor[];
declare const transformFiles: (files: FileDescriptor[], options: InternalOptions) => FileDescriptor[];
export { generateManifest, reduceAssets, reduceChunk, transformFiles };
