/// <reference types="node" />
import { LibuildPlugin, ILibuilder, Asset } from '../types';
export declare const assetExt: string[];
export declare const assetsPlugin: () => LibuildPlugin;
/**
 *
 * @param this Compiler
 * @param assetPath Absolute path of the asset
 * @param rebaseFrom Absolute path of the file which use asset
 * @param calledOnLoad called in load hooks
 * @returns dataurl or path
 */
export declare function getAssetContents(this: ILibuilder, assetPath: string, rebaseFrom: string, calledOnLoad?: boolean): Promise<{
    contents: string | Buffer;
    loader: "copy" | "text";
}>;
export declare function getOutputFileName(filePath: string, content: Buffer, assetName: Required<Asset['name']>): string;
export declare function getHash(content: Buffer | string, encoding: any, type?: string): string;
//# sourceMappingURL=asset.d.ts.map